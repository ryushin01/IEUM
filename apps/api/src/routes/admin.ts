import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AppContext } from '../context.ts';
import { badRequest, forbidden, notFound } from '../errors.ts';
import { releaseMedia } from '../media.ts';

const TARGETS = ['post', 'comment', 'user', 'message'];
const SLA_HOURS = 24;

interface Preview {
  text: string | null;
  imageUrl: string | null;
  authorId: string | null;
  authorNickname: string | null;
}

export function adminRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db, hub } = ctx;

  async function requireAdmin(req: FastifyRequest): Promise<string> {
    const me = await ctx.requireUser(req);
    const [row] = await db.query<{ is_admin: boolean }>('SELECT is_admin FROM users WHERE id = $1', [me]);
    if (!row?.is_admin) throw forbidden();
    return me;
  }

  /** 신고 대상의 현재 내용입니다. 이미 지워졌으면 null입니다. */
  async function previewOf(type: string, id: string): Promise<Preview | null> {
    const queries: Record<string, string> = {
      post: `SELECT p.caption AS text, (SELECT url FROM post_images i WHERE i.post_id = p.id ORDER BY position LIMIT 1) AS image_url,
               u.id AS author_id, u.nickname FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = $1`,
      comment: `SELECT c.body AS text, NULL AS image_url, u.id AS author_id, u.nickname
                FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1`,
      message: `SELECT m.body AS text, NULL AS image_url, u.id AS author_id, u.nickname
                FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = $1`,
      user: `SELECT u.bio AS text, u.avatar_url AS image_url, u.id AS author_id, u.nickname FROM users u WHERE u.id = $1`,
    };
    const [row] = await db.query<{ text: string; image_url: string | null; author_id: string; nickname: string }>(queries[type]!, [id]);
    return row ? { text: row.text, imageUrl: row.image_url, authorId: row.author_id, authorNickname: row.nickname } : null;
  }

  /** 같은 대상의 신고를 묶어 오래된 순서로 보여 줍니다. */
  app.get('/admin/reports', async (req) => {
    await requireAdmin(req);
    const groups = await db.query<{ target_type: string; target_id: string; count: number; reasons: string[]; first_at: Date; overdue: boolean }>(
      `SELECT target_type, target_id, count(*)::int AS count, array_agg(DISTINCT reason) AS reasons, min(created_at) AS first_at,
         min(created_at) < now() - interval '${SLA_HOURS} hours' AS overdue
       FROM reports WHERE status = 'open' GROUP BY target_type, target_id ORDER BY first_at LIMIT 50`,
    );
    return Promise.all(groups.map(async (g) => ({
      targetType: g.target_type,
      targetId: g.target_id,
      count: g.count,
      reasons: g.reasons,
      firstReportedAt: g.first_at,
      overdue: g.overdue,
      preview: await previewOf(g.target_type, g.target_id),
    })));
  });

  app.post('/admin/reports/resolve', async (req, reply) => {
    const adminId = await requireAdmin(req);
    const { targetType, targetId, action } = req.body as Record<string, unknown>;
    if (!TARGETS.includes(targetType as string) || typeof targetId !== 'string') throw badRequest('신고 대상을 확인해 주세요.');
    if (!['dismiss', 'remove', 'suspend'].includes(action as string)) throw badRequest('처리 방법을 확인해 주세요.');
    const preview = await previewOf(targetType as string, targetId);
    if (action !== 'dismiss' && !preview) throw notFound('이미 삭제된 대상입니다. 문제 없음으로 처리해 주세요.');

    if (action === 'remove') await removeContent(targetType as string, targetId, req);
    if (action === 'suspend') await suspend(preview!.authorId!, adminId);

    await db.query(
      `UPDATE reports SET status = 'resolved', resolved_action = $3, resolved_by = $4, resolved_at = now()
       WHERE target_type = $1 AND target_id = $2 AND status = 'open'`,
      [targetType, targetId, action, adminId],
    );
    reply.code(204);
  });

  async function removeContent(type: string, id: string, req: FastifyRequest) {
    if (type === 'user') throw badRequest('사용자는 삭제할 수 없습니다. 정지를 선택해 주세요.');
    if (type === 'post') {
      const images = await db.query<{ url: string }>('SELECT url FROM post_images WHERE post_id = $1', [id]);
      await db.query('DELETE FROM posts WHERE id = $1', [id]);
      await releaseMedia(ctx, images.map((image) => image.url), req.log);
      return;
    }
    await db.query(type === 'comment' ? 'DELETE FROM comments WHERE id = $1' : 'DELETE FROM messages WHERE id = $1', [id]);
  }

  async function suspend(userId: string, adminId: string) {
    if (userId === adminId) throw badRequest('자기 자신은 정지할 수 없습니다.');
    const [target] = await db.query<{ is_admin: boolean }>('SELECT is_admin FROM users WHERE id = $1', [userId]);
    if (target?.is_admin) throw badRequest('운영자는 정지할 수 없습니다.');
    await db.query('UPDATE users SET suspended_at = now() WHERE id = $1', [userId]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    hub.disconnect(userId);
  }

  app.get('/admin/users/suspended', async (req) => {
    await requireAdmin(req);
    const rows = await db.query<{ id: string; nickname: string; suspended_at: Date }>(
      'SELECT id, nickname, suspended_at FROM users WHERE suspended_at IS NOT NULL ORDER BY suspended_at DESC LIMIT 100',
    );
    return rows.map((r) => ({ id: r.id, nickname: r.nickname, suspendedAt: r.suspended_at }));
  });

  /** 잘못 정지한 경우 되돌립니다. */
  app.delete('/admin/users/:id/suspension', async (req, reply) => {
    await requireAdmin(req);
    await db.query('UPDATE users SET suspended_at = NULL WHERE id = $1', [(req.params as { id: string }).id]);
    reply.code(204);
  });
}
