import type { SocialCredentials } from './config.ts';

export const PROVIDERS = ['kakao', 'naver', 'google'] as const;
export type Provider = (typeof PROVIDERS)[number];

export interface SocialProfile {
  id: string;
  /** 제공자가 확인한 이메일만 담습니다. */
  email: string | null;
  nickname: string | null;
}

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

interface ProviderDef {
  authorize: string;
  token: string;
  profile: string;
  scope?: string;
  /** 네이버는 토큰 요청 값을 쿼리로 받습니다. */
  tokenInQuery?: boolean;
  parse(data: Json): SocialProfile;
}

const DEFS: Record<Provider, ProviderDef> = {
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
};

const endpoint = (provider: Provider, kind: 'authorize' | 'token' | 'profile', mockUrl?: string) =>
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
  }).toString();
  return url.toString();
}

const TIMEOUT = 10_000;

async function json(res: Response, what: string): Promise<Json> {
  if (!res.ok) throw new Error(`${what} 실패: ${res.status}`);
  return (await res.json()) as Json;
}

export async function fetchProfile(
  provider: Provider, credentials: SocialCredentials, redirectUri: string, code: string, state: string, mockUrl?: string,
): Promise<SocialProfile> {
  const def = DEFS[provider];
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
    redirect_uri: redirectUri,
    code,
    state,
  });
  const tokenEndpoint = endpoint(provider, 'token', mockUrl);
  const tokenRes = def.tokenInQuery
    ? await fetch(`${tokenEndpoint}?${params}`, { method: 'POST', signal: AbortSignal.timeout(TIMEOUT) })
    : await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: params,
        signal: AbortSignal.timeout(TIMEOUT),
      });
  const { access_token: accessToken } = await json(tokenRes, '토큰 요청');
  if (typeof accessToken !== 'string') throw new Error('토큰 응답에 access_token이 없습니다.');
  const profileRes = await fetch(endpoint(provider, 'profile', mockUrl), {
    headers: { authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(TIMEOUT),
  });
  return def.parse(await json(profileRes, '프로필 요청'));
}
