import type { FastifyInstance } from 'fastify';
import { badRequest, forbidden, notFound } from '../errors.ts';
import type { AppContext } from '../context.ts';
import { decodeCursor, encodeCursor, toMessage, toPublicUser, type MessageRow, type UserRow } from '../serializers.ts';

const PAGE_SIZE = 30;

export function conversationRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db, hub } = ctx;

  const isBlockedBetween = async (a: string, b: string) =>
    (await db.query(
      `SELECT 1 FROM blocks WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)
       UNION ALL SELECT 1 FROM users WHERE id = $2 AND suspended_at IS NOT NULL`,
      [a, b],
    )).length > 0;

  async function getMembership(conversationId: string, me: string) {
    const [row] = await db.query<{ user_a: string; user_b: string }>(
      'SELECT user_a, user_b FROM conversations WHERE id = $1 AND (user_a = $2 OR user_b = $2)',
      [conversationId, me],
    );
    if (!row) throw notFound('대화를 찾을 수 없습니다.');
    return { otherId: row.user_a === me ? row.user_b : row.user_a };
  }

  app.get('/conversations', async (req) => {
    const me = await ctx.requireUser(req);
    const rows = await db.query<UserRow & {
      conversation_id: string; last_body: string | null; last_at: Date | null; unread: number;
    }>(
      `SELECT u.*, c.id AS conversation_id, m.body AS last_body, m.created_at AS last_at,
         (SELECT count(*)::int FROM messages x
           WHERE x.conversation_id = c.id AND x.sender_id <> $1 AND x.read_at IS NULL) AS unread
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.user_a = $1 THEN c.user_b ELSE c.user_a END
       LEFT JOIN LATERAL (
         SELECT body, created_at FROM messages WHERE conversation_id = c.id
         ORDER BY created_at DESC, id DESC LIMIT 1
       ) m ON true
       WHERE (c.user_a = $1 OR c.user_b = $1) AND m.body IS NOT NULL AND u.suspended_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM blocks b
           WHERE (b.blocker_id = $1 AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = $1))
       ORDER BY m.created_at DESC`,
      [me],
    );
    return rows.map((r) => ({
      id: r.conversation_id,
      other: toPublicUser(r),
      lastMessage: r.last_body,
      lastMessageAt: r.last_at,
      unreadCount: r.unread,
    }));
  });

  app.post('/conversations', async (req) => {
    const me = await ctx.requireUser(req);
    const { userId } = req.body as { userId?: unknown };
    if (typeof userId !== 'string' || userId === me) throw badRequest('대화 상대를 확인해 주세요.');
    const [other] = await db.query('SELECT 1 FROM users WHERE id = $1', [userId]);
    if (!other) throw notFound('사용자를 찾을 수 없습니다.');
    if (await isBlockedBetween(me, userId)) throw forbidden('대화할 수 없는 사용자입니다.');
    const [a, b] = me < userId ? [me, userId] : [userId, me];
    const [row] = await db.query<{ id: string }>(
      `INSERT INTO conversations (user_a, user_b) VALUES ($1, $2)
       ON CONFLICT (user_a, user_b) DO UPDATE SET user_a = EXCLUDED.user_a RETURNING id`,
      [a, b],
    );
    return { id: row!.id };
  });

  app.get('/conversations/:id', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const { otherId } = await getMembership(id, me);
    const [other] = await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [otherId]);
    return { id, other: toPublicUser(other!), canSend: !(await isBlockedBetween(me, otherId)) };
  });

  app.get('/conversations/:id/messages', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const { cursor } = req.query as { cursor?: string };
    await getMembership(id, me);
    const params: unknown[] = [id];
    let where = 'conversation_id = $1';
    if (cursor) {
      const c = decodeCursor(cursor);
      params.push(c.createdAt, c.id);
      where += ' AND (created_at, id) < ($2::timestamptz, $3::uuid)';
    }
    const rows = await db.query<MessageRow>(
      `SELECT * FROM messages WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT ${PAGE_SIZE + 1}`,
      params,
    );
    const page = rows.slice(0, PAGE_SIZE);
    const last = page.at(-1);
    return {
      items: page.map(toMessage),
      nextCursor: rows.length > PAGE_SIZE && last ? encodeCursor(last.created_at, last.id) : null,
    };
  });

  app.post('/conversations/:id/messages', {
    config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
  }, async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const { body } = req.body as { body?: unknown };
    if (typeof body !== 'string' || !body.trim() || body.length > 1000) {
      throw badRequest('메시지를 1자 이상 1,000자 이하로 입력해 주세요.');
    }
    const { otherId } = await getMembership(id, me);
    if (await isBlockedBetween(me, otherId)) throw forbidden('메시지를 보낼 수 없는 사용자입니다.');
    const [row] = await db.query<MessageRow>(
      'INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING *',
      [id, me, body.trim()],
    );
    const message = toMessage(row!);
    hub.send(otherId, { type: 'message', message });
    hub.send(me, { type: 'message', message });
    reply.code(201);
    return message;
  });

  app.post('/conversations/:id/read', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const { otherId } = await getMembership(id, me);
    const updated = await db.query(
      `UPDATE messages SET read_at = now()
       WHERE conversation_id = $1 AND sender_id <> $2 AND read_at IS NULL RETURNING id`,
      [id, me],
    );
    if (updated.length) hub.send(otherId, { type: 'read', conversationId: id });
    reply.code(204);
  });
}
