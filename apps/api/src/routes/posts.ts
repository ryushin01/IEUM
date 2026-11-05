import type { FastifyInstance } from 'fastify';
import { badRequest, forbidden, notFound } from '../errors.ts';
import { releaseMedia } from '../media.ts';
import { assertAllowedText } from '../moderation.ts';
import type { AppContext } from '../context.ts';
import { assertUploadedUrl } from '../uploads.ts';
import { decodeCursor, encodeCursor, POST_SELECT, toComment, toPost, type CommentRow, type PostRow } from '../serializers.ts';

const PAGE_SIZE = 10;
const MAX_IMAGES = 5;
/** 차단 관계와 정지된 작성자의 글을 숨깁니다. */
const NOT_BLOCKED = (alias: string, me: string) => `NOT EXISTS (
  SELECT 1 FROM blocks b WHERE (b.blocker_id = ${me} AND b.blocked_id = ${alias})
    OR (b.blocker_id = ${alias} AND b.blocked_id = ${me}))
  AND NOT EXISTS (SELECT 1 FROM users s WHERE s.id = ${alias} AND s.suspended_at IS NOT NULL)`;

function parseCaption(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 2200) {
    throw badRequest('내용을 1자 이상 2,200자 이하로 입력해 주세요.');
  }
  assertAllowedText(value);
  return value.trim();
}

export function postRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db } = ctx;

  async function findPost(id: string, me: string) {
    const [row] = await db.query<PostRow>(
      `${POST_SELECT} WHERE p.id = $2 AND ${NOT_BLOCKED('p.author_id', '$1')}`,
      [me, id],
    );
    if (!row) throw notFound('게시글을 찾을 수 없습니다.');
    return row;
  }

  app.get('/posts', async (req) => {
    const me = await ctx.requireUser(req);
    const { cursor, authorId } = req.query as { cursor?: string; authorId?: string };
    const params: unknown[] = [me];
    const where = [NOT_BLOCKED('p.author_id', '$1')];
    if (authorId) {
      params.push(authorId);
      where.push(`p.author_id = $${params.length}`);
    }
    if (cursor) {
      const { createdAt, id } = decodeCursor(cursor);
      params.push(createdAt, id);
      where.push(`(p.created_at, p.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
    }
    const rows = await db.query<PostRow>(
      `${POST_SELECT} WHERE ${where.join(' AND ')}
       ORDER BY p.created_at DESC, p.id DESC LIMIT ${PAGE_SIZE + 1}`,
      params,
    );
    const page = rows.slice(0, PAGE_SIZE);
    const last = page.at(-1);
    return {
      items: page.map(toPost),
      nextCursor: rows.length > PAGE_SIZE && last ? encodeCursor(last.created_at, last.id) : null,
    };
  });

  app.get('/posts/:id', async (req) => {
    const me = await ctx.requireUser(req);
    return toPost(await findPost((req.params as { id: string }).id, me));
  });

  app.post('/posts', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { caption, images } = req.body as { caption?: unknown; images?: unknown };
    const text = parseCaption(caption);
    if (!Array.isArray(images) || images.length < 1 || images.length > MAX_IMAGES) {
      throw badRequest(`이미지를 1장 이상 ${MAX_IMAGES}장 이하로 올려 주세요.`);
    }
    for (const image of images as { url?: unknown; alt?: unknown }[]) {
      assertUploadedUrl(ctx, image?.url);
      if (image.alt !== undefined && (typeof image.alt !== 'string' || image.alt.length > 200)) {
        throw badRequest('이미지 설명은 200자까지 입력할 수 있습니다.');
      }
    }
    const [post] = await db.query<{ id: string }>(
      'INSERT INTO posts (author_id, caption) VALUES ($1, $2) RETURNING id',
      [me, text],
    );
    for (const [position, image] of (images as { url: string; alt?: string }[]).entries()) {
      await db.query('INSERT INTO post_images (post_id, position, url, alt) VALUES ($1, $2, $3, $4)', [
        post!.id, position, image.url, image.alt ?? '',
      ]);
    }
    reply.code(201);
    return toPost(await findPost(post!.id, me));
  });

  app.patch('/posts/:id', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const text = parseCaption((req.body as { caption?: unknown }).caption);
    const existing = await findPost(id, me);
    if (existing.author_id !== me) throw forbidden();
    await db.query('UPDATE posts SET caption = $2, updated_at = now() WHERE id = $1', [id, text]);
    return toPost(await findPost(id, me));
  });

  app.delete('/posts/:id', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const existing = await findPost(id, me);
    if (existing.author_id !== me) throw forbidden();
    await db.query('DELETE FROM posts WHERE id = $1', [id]);
    await releaseMedia(ctx, existing.images.map((image) => image.url), req.log);
    reply.code(204);
  });

  app.put('/posts/:id/like', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    await findPost(id, me);
    await db.query('INSERT INTO likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, me]);
    return toPost(await findPost(id, me));
  });

  app.delete('/posts/:id/like', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    await findPost(id, me);
    await db.query('DELETE FROM likes WHERE post_id = $1 AND user_id = $2', [id, me]);
    return toPost(await findPost(id, me));
  });

  app.get('/posts/:id/comments', async (req) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    await findPost(id, me);
    const rows = await db.query<CommentRow>(
      `SELECT c.*, u.nickname, u.avatar_url FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1 AND ${NOT_BLOCKED('c.author_id', '$2')}
       ORDER BY c.created_at LIMIT 200`,
      [id, me],
    );
    return rows.map(toComment);
  });

  app.post('/posts/:id/comments', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const { body } = req.body as { body?: unknown };
    if (typeof body !== 'string' || !body.trim() || body.length > 100) {
      throw badRequest('댓글을 1자 이상 100자 이하로 입력해 주세요.');
    }
    assertAllowedText(body);
    await findPost(id, me);
    const [row] = await db.query<CommentRow>(
      `WITH c AS (INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3) RETURNING *)
       SELECT c.*, u.nickname, u.avatar_url FROM c JOIN users u ON u.id = c.author_id`,
      [id, me, body.trim()],
    );
    reply.code(201);
    return toComment(row!);
  });

  app.delete('/comments/:id', async (req, reply) => {
    const me = await ctx.requireUser(req);
    const { id } = req.params as { id: string };
    const [row] = await db.query<{ author_id: string; post_author: string }>(
      `SELECT c.author_id, p.author_id AS post_author FROM comments c JOIN posts p ON p.id = c.post_id WHERE c.id = $1`,
      [id],
    );
    if (!row) throw notFound('댓글을 찾을 수 없습니다.');
    if (row.author_id !== me && row.post_author !== me) throw forbidden();
    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    reply.code(204);
  });
}
