import type { FastifyInstance } from 'fastify';
import { hashPassword, verifyPassword } from '../auth.ts';
import { ApiError, badRequest, conflict, unauthorized } from '../errors.ts';
import { assertAllowedText } from '../moderation.ts';
import type { AppContext } from '../context.ts';
import { revokeProviderTokens } from './social.ts';
import { parseInterests, toMe, type UserRow } from '../serializers.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NICKNAME = /^[\p{L}\p{N}_.]{2,20}$/u;
const PASSWORD = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,72}$/;
const authLimit = { rateLimit: { max: 10, timeWindow: '1 minute' } };

export function authRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db, tokens, hub } = ctx;

  app.get('/auth/nickname-available', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req) => {
    const { nickname } = req.query as { nickname?: string };
    if (!nickname || !NICKNAME.test(nickname)) throw badRequest('닉네임은 2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.');
    assertAllowedText(nickname);
    const taken = await db.query('SELECT 1 FROM users WHERE nickname = $1', [nickname]);
    return { available: taken.length === 0 };
  });

  app.post('/auth/signup', { config: authLimit }, async (req, reply) => {
    const { email, password, nickname, interests, agreeTerms, confirmAge } = req.body as Record<string, unknown>;
    if (typeof email !== 'string' || !EMAIL.test(email)) throw badRequest('이메일 형식을 확인해 주세요.');
    if (typeof password !== 'string' || !PASSWORD.test(password)) {
      throw badRequest('비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.');
    }
    if (typeof nickname !== 'string' || !NICKNAME.test(nickname)) {
      throw badRequest('닉네임은 2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.');
    }
    assertAllowedText(nickname);
    if (agreeTerms !== true) throw badRequest('약관과 개인정보 처리방침에 동의해 주세요.');
    if (confirmAge !== true) throw badRequest('만 14세 이상만 가입할 수 있습니다.');

    const rows = await db.query<UserRow>(
      `INSERT INTO users (email, password_hash, nickname, interests, terms_agreed_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT DO NOTHING RETURNING *`,
      [email.toLowerCase(), await hashPassword(password), nickname, parseInterests(interests ?? [])],
    );
    if (!rows[0]) throw conflict('이미 사용 중인 이메일 또는 닉네임입니다.');
    reply.code(201);
    return { user: toMe(rows[0]), ...(await tokens.issuePair(rows[0].id)) };
  });

  app.post('/auth/login', { config: authLimit }, async (req) => {
    const { email, password } = req.body as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw badRequest('이메일과 비밀번호를 입력해 주세요.');
    }
    const [user] = await db.query<UserRow>('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError(401, 'invalid_credentials', '이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return { user: toMe(user), ...(await tokens.issuePair(user.id)) };
  });

  app.post('/auth/refresh', { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } }, async (req) => {
    const { refreshToken } = req.body as { refreshToken?: unknown };
    if (typeof refreshToken !== 'string') throw unauthorized();
    return tokens.rotate(refreshToken);
  });

  app.post('/auth/logout', async (req, reply) => {
    const { refreshToken } = (req.body ?? {}) as { refreshToken?: unknown };
    if (typeof refreshToken === 'string') await tokens.revoke(refreshToken);
    reply.code(204);
  });

  /** 앱 안에서 바로 탈퇴할 수 있어야 합니다. (Apple 5.1.1(v), Google Play 계정 삭제 정책) */
  app.delete('/me', async (req, reply) => {
    const userId = await ctx.requireUser(req);
    const { password, confirmText } = (req.body ?? {}) as { password?: unknown; confirmText?: unknown };
    const [user] = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) throw unauthorized();
    if (user.password_hash === null) {
      // 소셜 계정은 비밀번호가 없으므로 문구 입력으로 확인합니다.
      if (confirmText !== '삭제') throw new ApiError(403, 'invalid_confirmation', '확인 문구를 정확히 입력해 주세요.');
    } else if (typeof password !== 'string' || !(await verifyPassword(password, user.password_hash))) {
      throw new ApiError(403, 'invalid_credentials', '비밀번호가 올바르지 않습니다.');
    }
    await revokeProviderTokens(ctx, userId, req.log);
    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    hub.disconnect(userId);
    reply.code(204);
  });
}
