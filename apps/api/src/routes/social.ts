import { createHash, randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../context.ts';
import { ApiError, badRequest, conflict, notFound, unauthorized } from '../errors.ts';
import { assertAllowedText } from '../moderation.ts';
import { parseInterests, toMe, type UserRow } from '../serializers.ts';
import { buildAuthorizeUrl, fetchProfile, PROVIDERS, revokeAppleToken, type Provider } from '../social-providers.ts';
import { openToken, sealToken } from '../token-box.ts';

const APP_CALLBACK = 'com.ryushin01.ieum://auth';
const NICKNAME = /^[\p{L}\p{N}_.]{2,20}$/u;
const CODE_CHALLENGE = /^[\w-]{43}$/;
const limit = { rateLimit: { max: 20, timeWindow: '1 minute' } };

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const pkce = (verifier: string) => createHash('sha256').update(verifier).digest('base64url');
const newToken = () => randomBytes(32).toString('base64url');

/** 제공자 닉네임을 규칙에 맞게 다듬어 입력 기본값으로만 씁니다. */
function suggestNickname(value: string | null): string {
  const cleaned = (value ?? '').replace(/[^\p{L}\p{N}_.]/gu, '').slice(0, 20);
  return cleaned.length >= 2 ? cleaned : '';
}

interface TicketRow {
  provider: Provider;
  provider_user_id: string;
  email: string | null;
  nickname: string | null;
  code_challenge: string | null;
  provider_token: string | null;
}

/** 계정 삭제 전에 호출합니다. 폐기에 실패해도 사용자의 삭제 요청은 막지 않고 기록을 남깁니다. */
export async function revokeProviderTokens(ctx: AppContext, userId: string, log: { error(data: object, message: string): void }): Promise<void> {
  const credentials = ctx.config.social.apple;
  if (!credentials) return;
  const rows = await ctx.db.query<{ provider_token: string }>(
    `SELECT provider_token FROM social_accounts WHERE user_id = $1 AND provider = 'apple' AND provider_token IS NOT NULL`,
    [userId],
  );
  for (const { provider_token: sealed } of rows) {
    try {
      await revokeAppleToken(credentials, openToken(sealed, ctx.config.socialTokenKey), ctx.config.socialMockUrl);
    } catch (failure) {
      log.error({ userId, message: (failure as Error).message }, 'apple token revoke failed');
    }
  }
}

export function socialRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db, tokens, config } = ctx;
  const redirectUri = (provider: Provider) => `${config.publicBaseUrl}/auth/social/${provider}/callback`;

  function parseProvider(value: unknown): Provider {
    if (!PROVIDERS.includes(value as Provider) || !config.social[value as Provider]) {
      throw notFound('지원하지 않는 로그인 방식입니다.');
    }
    return value as Provider;
  }

  const clientRedirect = (client: string, query: Record<string, string>) =>
    `${client === 'app' ? APP_CALLBACK : `${config.webUrl}/auth/callback`}?${new URLSearchParams(query)}`;

  /** 키를 설정한 제공자만 화면에 표시합니다. */
  app.get('/auth/social/providers', async () => PROVIDERS.filter((provider) => config.social[provider]));

  app.post('/auth/social/:provider/start', { config: limit }, async (req) => {
    const provider = parseProvider((req.params as { provider: string }).provider);
    const { client, codeChallenge } = req.body as { client?: unknown; codeChallenge?: unknown };
    if (client !== 'app' && client !== 'web') throw badRequest('요청을 확인해 주세요.');
    if (typeof codeChallenge !== 'string' || !CODE_CHALLENGE.test(codeChallenge)) throw badRequest('요청을 확인해 주세요.');
    await db.query('DELETE FROM oauth_states WHERE expires_at < now()');
    await db.query('DELETE FROM social_tickets WHERE expires_at < now()');
    const state = newToken();
    await db.query(
      `INSERT INTO oauth_states (state_hash, provider, client, code_challenge, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '10 minutes')`,
      [sha256(state), provider, client, codeChallenge],
    );
    return { url: buildAuthorizeUrl(provider, config.social[provider]!, redirectUri(provider), state, config.socialMockUrl) };
  });

  // Apple은 POST, 나머지는 GET으로 돌아옵니다. POST 뒤에도 GET으로 이동하도록 303을 씁니다.
  app.route({
    method: ['GET', 'POST'],
    url: '/auth/social/:provider/callback',
    handler: async (req, reply) => {
      const provider = parseProvider((req.params as { provider: string }).provider);
      const { code, state, error, user: appleUser } = (req.method === 'POST' ? req.body : req.query) as Record<string, string | undefined>;
      const [row] = state
        ? await db.query<{ client: string; code_challenge: string }>(
            `DELETE FROM oauth_states WHERE state_hash = $1 AND provider = $2 AND expires_at > now()
             RETURNING client, code_challenge`,
            [sha256(state), provider],
          )
        : [];
      if (!row) throw badRequest('로그인 요청이 만료되었습니다. 앱에서 다시 시도해 주세요.');
      if (error || !code) return reply.redirect(clientRedirect(row.client, { error: 'denied' }), 303);
      try {
        const profile = await fetchProfile(provider, config.social[provider]!, redirectUri(provider), code, state!, config.socialMockUrl, appleUser);
        const ticket = newToken();
        await db.query(
          `INSERT INTO social_tickets (ticket_hash, kind, provider, provider_user_id, email, nickname, code_challenge, provider_token, expires_at)
           VALUES ($1, 'login', $2, $3, $4, $5, $6, $7, now() + interval '2 minutes')`,
          [
            sha256(ticket), provider, profile.id, profile.email?.toLowerCase() ?? null, profile.nickname, row.code_challenge,
            profile.refreshToken ? sealToken(profile.refreshToken, config.socialTokenKey) : null,
          ],
        );
        return reply.redirect(clientRedirect(row.client, { code: ticket }), 303);
      } catch (failure) {
        req.log.error({ provider, message: (failure as Error).message }, 'social login failed');
        return reply.redirect(clientRedirect(row.client, { error: 'failed' }), 303);
      }
    },
  });

  /** 로그인을 시작한 쪽만 코드를 쓸 수 있도록 PKCE로 확인합니다. */
  app.post('/auth/social/exchange', { config: limit }, async (req) => {
    const { code, codeVerifier } = req.body as { code?: unknown; codeVerifier?: unknown };
    if (typeof code !== 'string' || typeof codeVerifier !== 'string') throw badRequest('요청을 확인해 주세요.');
    const [ticket] = await db.query<TicketRow>(
      `DELETE FROM social_tickets WHERE ticket_hash = $1 AND kind = 'login' AND expires_at > now() RETURNING *`,
      [sha256(code)],
    );
    if (!ticket || ticket.code_challenge !== pkce(codeVerifier)) {
      throw unauthorized('로그인이 만료되었습니다. 다시 시도해 주세요.');
    }
    const [user] = await db.query<UserRow>(
      `SELECT u.* FROM social_accounts s JOIN users u ON u.id = s.user_id
       WHERE s.provider = $1 AND s.provider_user_id = $2`,
      [ticket.provider, ticket.provider_user_id],
    );
    if (user) {
      if (user.suspended_at) throw new ApiError(403, 'suspended', '이용이 제한된 계정입니다. 문의해 주세요.');
      if (ticket.provider_token) {
        await db.query('UPDATE social_accounts SET provider_token = $3 WHERE provider = $1 AND provider_user_id = $2', [
          ticket.provider, ticket.provider_user_id, ticket.provider_token,
        ]);
      }
      return { status: 'login', user: toMe(user), ...(await tokens.issuePair(user.id)) };
    }

    // 이메일이 같다고 자동으로 합치지 않습니다. (계정 탈취 방지)
    if (ticket.email) {
      const [existing] = await db.query('SELECT 1 FROM users WHERE email = $1', [ticket.email]);
      if (existing) throw new ApiError(409, 'email_exists', '이미 가입된 이메일입니다. 처음 가입한 방법으로 로그인해 주세요.');
    }
    const signupToken = newToken();
    await db.query(
      `INSERT INTO social_tickets (ticket_hash, kind, provider, provider_user_id, email, nickname, provider_token, expires_at)
       VALUES ($1, 'signup', $2, $3, $4, $5, $6, now() + interval '30 minutes')`,
      [sha256(signupToken), ticket.provider, ticket.provider_user_id, ticket.email, ticket.nickname, ticket.provider_token],
    );
    return { status: 'signup', signupToken, provider: ticket.provider, nickname: suggestNickname(ticket.nickname) };
  });

  app.post('/auth/social/signup', { config: limit }, async (req, reply) => {
    const { signupToken, nickname, interests, agreeTerms, confirmAge } = req.body as Record<string, unknown>;
    if (typeof signupToken !== 'string') throw unauthorized();
    if (typeof nickname !== 'string' || !NICKNAME.test(nickname)) {
      throw badRequest('닉네임은 2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.');
    }
    assertAllowedText(nickname);
    if (agreeTerms !== true) throw badRequest('약관과 개인정보 처리방침에 동의해 주세요.');
    if (confirmAge !== true) throw badRequest('만 14세 이상만 가입할 수 있습니다.');
    const parsedInterests = parseInterests(interests ?? []);
    const [ticket] = await db.query<TicketRow>(
      `SELECT * FROM social_tickets WHERE ticket_hash = $1 AND kind = 'signup' AND expires_at > now()`,
      [sha256(signupToken)],
    );
    if (!ticket) throw unauthorized('가입 시간이 지났습니다. 다시 로그인해 주세요.');
    const [taken] = await db.query('SELECT 1 FROM users WHERE nickname = $1', [nickname]);
    if (taken) throw conflict('이미 사용 중인 닉네임입니다.');
    const [user] = await db.query<UserRow>(
      `WITH u AS (
         INSERT INTO users (email, nickname, interests, terms_agreed_at) VALUES ($1, $2, $3, now()) RETURNING *
       ), s AS (
         INSERT INTO social_accounts (provider, provider_user_id, user_id, provider_token) SELECT $4, $5, id, $6 FROM u
       ) SELECT * FROM u`,
      [ticket.email, nickname, parsedInterests, ticket.provider, ticket.provider_user_id, ticket.provider_token],
    );
    await db.query('DELETE FROM social_tickets WHERE ticket_hash = $1', [sha256(signupToken)]);
    reply.code(201);
    return { user: toMe(user!), ...(await tokens.issuePair(user!.id)) };
  });
}
