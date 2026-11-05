import { decodeJwt, importPKCS8, SignJWT } from 'jose';
import type { SocialCredentials } from './config.ts';

export const PROVIDERS = ['kakao', 'naver', 'google', 'apple'] as const;
export type Provider = (typeof PROVIDERS)[number];

export interface SocialProfile {
  id: string;
  /** 제공자가 확인한 이메일만 담습니다. */
  email: string | null;
  nickname: string | null;
  /** 계정 삭제 때 폐기해야 하는 토큰(Apple) */
  refreshToken?: string;
}

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface ProviderDef {
  authorize: string;
  token: string;
  profile: string;
  scope?: string;
  /** Apple은 이름과 이메일을 요청하면 콜백을 POST로 보냅니다. */
  formPost?: boolean;
  /** 네이버는 토큰 요청 값을 쿼리로 받습니다. */
  tokenInQuery?: boolean;
  parse(data: Json): SocialProfile;
}

const APPLE_ISSUER = 'https://appleid.apple.com';

const DEFS: Record<Exclude<Provider, 'apple'>, ProviderDef> & { apple: Omit<ProviderDef, 'profile' | 'parse'> } = {
  kakao: {
    authorize: 'https://kauth.kakao.com/oauth/authorize',
    token: 'https://kauth.kakao.com/oauth/token',
    profile: 'https://kapi.kakao.com/v2/user/me',
    parse: (d) => ({
      id: String(d.id),
      email: d.kakao_account?.is_email_verified === true ? (d.kakao_account.email ?? null) : null,
      nickname: d.kakao_account?.profile?.nickname ?? d.properties?.nickname ?? null,
    }),
  },
  naver: {
    authorize: 'https://nid.naver.com/oauth2.0/authorize',
    token: 'https://nid.naver.com/oauth2.0/token',
    profile: 'https://openapi.naver.com/v1/nid/me',
    tokenInQuery: true,
    // 네이버는 이메일 확인 여부를 주지 않으므로 계정 식별에 쓰지 않습니다.
    parse: (d) => ({ id: String(d.response.id), email: null, nickname: d.response.nickname ?? d.response.name ?? null }),
  },
  google: {
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    profile: 'https://openidconnect.googleapis.com/v1/userinfo',
    scope: 'openid email profile',
    parse: (d) => ({
      id: String(d.sub),
      email: d.email_verified === true ? (d.email ?? null) : null,
      nickname: d.name ?? null,
    }),
  },
  // 프로필 API가 없고 토큰 응답의 id_token에 사용자 정보가 들어 있습니다.
  apple: {
    authorize: `${APPLE_ISSUER}/auth/authorize`,
    token: `${APPLE_ISSUER}/auth/token`,
    scope: 'name email',
    formPost: true,
  },
};

const endpoint = (provider: Provider, kind: 'authorize' | 'token', mockUrl?: string) =>
  mockUrl ? `${mockUrl}/${provider}/${kind}` : DEFS[provider][kind];

export function buildAuthorizeUrl(
  provider: Provider, credentials: SocialCredentials, redirectUri: string, state: string, mockUrl?: string,
): string {
  const url = new URL(endpoint(provider, 'authorize', mockUrl));
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: credentials.clientId,
    redirect_uri: redirectUri,
    state,
    ...(DEFS[provider].scope ? { scope: DEFS[provider].scope } : {}),
    ...(DEFS[provider].formPost ? { response_mode: 'form_post' } : {}),
  }).toString();
  return url.toString();
}

const TIMEOUT = 10_000;

async function json(res: Response, what: string): Promise<Json> {
  if (!res.ok) throw new Error(`${what} 실패: ${res.status}`);
  return (await res.json()) as Json;
}

/** Apple의 Client Secret은 .p8 키로 서명한 짧은 수명의 JWT입니다. */
async function clientSecret(credentials: SocialCredentials): Promise<string> {
  if (!credentials.apple) return credentials.clientSecret!;
  const { teamId, keyId, privateKey } = credentials.apple;
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setSubject(credentials.clientId)
    .setAudience(APPLE_ISSUER)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(await importPKCS8(privateKey, 'ES256'));
}

/**
 * id_token은 https로 토큰 엔드포인트에서 직접 받았으므로 서명 검증을 생략하고 값만 확인합니다.
 * (OpenID Connect Core 3.1.3.7)
 */
function parseAppleIdToken(idToken: string, clientId: string, appleUser?: string): SocialProfile {
  const claims = decodeJwt(idToken);
  if (claims.iss !== APPLE_ISSUER || claims.aud !== clientId || !claims.sub) throw new Error('id_token 값이 올바르지 않습니다.');
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error('id_token이 만료되었습니다.');
  const verified = claims.email_verified === true || claims.email_verified === 'true';
  return { id: claims.sub, email: verified && typeof claims.email === 'string' ? claims.email : null, nickname: parseAppleName(appleUser) };
}

/** 이름은 처음 동의할 때 한 번만 옵니다. 입력 기본값으로만 쓰므로 읽지 못해도 진행합니다. */
function parseAppleName(appleUser?: string): string | null {
  try {
    const { name } = JSON.parse(appleUser ?? '{}') as { name?: { firstName?: string; lastName?: string } };
    return `${name?.lastName ?? ''}${name?.firstName ?? ''}` || null;
  } catch {
    return null;
  }
}

export async function fetchProfile(
  provider: Provider, credentials: SocialCredentials, redirectUri: string, code: string, state: string,
  mockUrl?: string, appleUser?: string,
): Promise<SocialProfile> {
  const def = DEFS[provider];
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: credentials.clientId,
    client_secret: await clientSecret(credentials),
    redirect_uri: redirectUri,
    code,
    state,
  });
  const tokenEndpoint = endpoint(provider, 'token', mockUrl);
  const tokenRes = 'tokenInQuery' in def && def.tokenInQuery
    ? await fetch(`${tokenEndpoint}?${params}`, { method: 'POST', signal: AbortSignal.timeout(TIMEOUT) })
    : await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: AbortSignal.timeout(TIMEOUT),
      });
  const token = await json(tokenRes, '토큰 요청');
  if (provider === 'apple') {
    if (typeof token.id_token !== 'string') throw new Error('토큰 응답에 id_token이 없습니다.');
    return { ...parseAppleIdToken(token.id_token, credentials.clientId, appleUser), refreshToken: token.refresh_token };
  }
  if (typeof token.access_token !== 'string') throw new Error('토큰 응답에 access_token이 없습니다.');
  const profileUrl = mockUrl ? `${mockUrl}/${provider}/profile` : DEFS[provider].profile;
  const profileRes = await fetch(profileUrl, {
    headers: { authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  return DEFS[provider].parse(await json(profileRes, '프로필 요청'));
}

/** 계정을 삭제하면 Apple 토큰을 폐기해야 합니다. (Apple 5.1.1(v)) */
export async function revokeAppleToken(credentials: SocialCredentials, refreshToken: string, mockUrl?: string): Promise<void> {
  const url = mockUrl ? `${mockUrl}/apple/revoke` : `${APPLE_ISSUER}/auth/revoke`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: await clientSecret(credentials),
      token: refreshToken,
      token_type_hint: 'refresh_token',
    }),
    signal: AbortSignal.timeout(TIMEOUT),
  });
  if (!res.ok) throw new Error(`토큰 폐기 실패: ${res.status}`);
}
