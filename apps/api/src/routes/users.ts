import type { FastifyInstance } from 'fastify';
import { badRequest, conflict, notFound } from '../errors.ts';
import { releaseMedia } from '../media.ts';
import { assertAllowedText } from '../moderation.ts';
import type { AppContext } from '../context.ts';
import { assertUploadedUrl } from '../uploads.ts';
import { parseInterests, toMe, toPublicUser, type UserRow } from '../serializers.ts';

const NICKNAME = /^[\p{L}\p{N}_.]{2,20}$/u;

export function userRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db } = ctx;

  app.get('/me', async (req) => {
    const userId = await ctx.requireUser(req);
    const [user] = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [userId]);
    if (!user) throw notFound();
    return toMe(user);
  });

  app.patch('/me', async (req) => {
    const userId = await ctx.requireUser(req);
    const { nickname, bio, avatarUrl, interests } = req.body as Record<string, unknown>;
    if (nickname !== undefined) {
      if (typeof nickname !== 'string' || !NICKNAME.test(nickname)) {
        throw badRequest('닉네임은 2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.');
      }
      assertAllowedText(nickname);
    }
    if (bio !== undefined) {
      if (typeof bio !== 'string' || bio.length > 150) throw badRequest('소개는 150자까지 입력할 수 있습니다.');
      assertAllowedText(bio);
    }
    if (avatarUrl !== undefined && avatarUrl !== null) assertUploadedUrl(ctx, avatarUrl);
    const taken = nickname
      ? await db.query('SELECT 1 FROM users WHERE nickname = $1 AND id <> $2', [nickname, userId])
      : [];
    if (taken.length) throw conflict('이미 사용 중인 닉네임입니다.');
    const [before] = await db.query<UserRow>('SELECT avatar_url FROM users WHERE id = $1', [userId]);
    const [user] = await db.query<UserRow>(
      `UPDATE users SET nickname = COALESCE($2, nickname), bio = COALESCE($3, bio),
         avatar_url = CASE WHEN $4 THEN $5 ELSE avatar_url END,
         interests = COALESCE($6, interests)
       WHERE id = $1 RETURNING *`,
      [userId, nickname ?? null, bio ?? null, avatarUrl !== undefined, avatarUrl ?? null,
        interests === undefined ? null : parseInterests(interests)],
    );
    if (before?.avatar_url !== user!.avatar_url) await releaseMedia(ctx, [before?.avatar_url], req.log);
    return toMe(user!);
  });

  app.get('/users/:id', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const [user] = await db.query<UserRow & { post_count: number; is_blocked: boolean; blocked_me: boolean }>(
      `SELECT u.*, (SELECT count(*)::int FROM posts p WHERE p.author_id = u.id) AS post_count,
         EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = $2 AND b.blocked_id = u.id) AS is_blocked,
         EXISTS (SELECT 1 FROM blocks b WHERE b.blocker_id = u.id AND b.blocked_id = $2) AS blocked_me
       FROM users u WHERE u.id = $1`,
      [id, me],
    );
    if (!user || user.blocked_me || user.suspended_at) throw notFound('사용자를 찾을 수 없습니다.');
    return { ...toPublicUser(user), postCount: user.post_count, isBlocked: user.is_blocked };
  });

  app.put('/users/:id/block', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    if (id === me) throw badRequest('자기 자신은 차단할 수 없습니다.');
    const [target] = await db.query('SELECT 1 FROM users WHERE id = $1', [id]);
    if (!target) throw notFound('사용자를 찾을 수 없습니다.');
    await db.query('INSERT INTO blocks (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [me, id]);
    reply.code(204);
  });

  app.delete('/users/:id/block', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    await db.query('DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2', [me, id]);
    reply.code(204);
  });

  app.get('/me/blocks', async (req) => {
    const me = await ctx.requireUser(req);
    const rows = await db.query<UserRow>(
      `SELECT u.* FROM blocks b JOIN users u ON u.id = b.blocked_id
       WHERE b.blocker_id = $1 ORDER BY b.created_at DESC`,
      [me],
    );
    return rows.map(toPublicUser);
  });

  app.post('/reports', { config: { rateLimit: { max: 20, timeWindow: '1 minute' } } }, async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { targetType, targetId, reason } = req.body as Record<string, unknown>;
    if (!['post', 'comment', 'user', 'message'].includes(targetType as string)) {
      throw badRequest('신고 대상을 확인해 주세요.');
    }
    if (typeof targetId !== 'string' || typeof reason !== 'string' || !reason.trim() || reason.length > 500) {
      throw badRequest('신고 사유를 500자 이내로 입력해 주세요.');
    }
    const created = await db.query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES ($1, $2, $3, $4)
       ON CONFLICT (reporter_id, target_type, target_id) DO NOTHING RETURNING id`,
      [me, targetType, targetId, reason.trim()],
    );
    // 24시간 안에 처리할 수 있도록 운영자에게 알립니다. 내용은 메일에 넣지 않습니다.
    const alertTo = ctx.config.reportAlertEmail;
    if (created.length && alertTo) {
      void ctx.mailer.send({
        to: alertTo,
        subject: '[이음] 새 신고가 접수되었습니다',
        text: `24시간 안에 처리해 주세요.\n\n${ctx.config.webUrl}/admin/reports`,
      }).catch((failure: Error) => req.log.error({ message: failure.message }, 'report alert failed'));
    }
    reply.code(201);
    return { ok: true };
  });
}
