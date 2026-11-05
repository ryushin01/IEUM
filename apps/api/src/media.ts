import type { AppContext } from './context.ts';

const KEY = /^[\w-]+\.(jpg|png|webp)$/;

export function keyFromUrl(ctx: AppContext, url: string): string | null {
  const prefix = `${ctx.config.mediaBaseUrl}/`;
  if (!url.startsWith(prefix)) return null;
  const key = url.slice(prefix.length);
  return KEY.test(key) ? key : null;
}

interface Log { error(data: object, message: string): void }

/** 더 이상 쓰이지 않는 이미지를 저장소에서 지웁니다. 실패해도 사용자 요청은 막지 않고 기록만 남깁니다. */
export async function releaseMedia(ctx: AppContext, urls: (string | null | undefined)[], log: Log): Promise<void> {
  for (const url of new Set(urls)) {
    if (!url) continue;
    const key = keyFromUrl(ctx, url);
    if (!key) continue;
    try {
      const [used] = await ctx.db.query(
        `SELECT 1 FROM post_images WHERE url = $1 UNION ALL SELECT 1 FROM users WHERE avatar_url = $1 LIMIT 1`,
        [url],
      );
      if (used) continue;
      await ctx.storage.delete(key);
      await ctx.db.query('DELETE FROM uploads WHERE key = $1', [key]);
    } catch (failure) {
      log.error({ key, message: (failure as Error).message }, 'media delete failed');
    }
  }
}

/** 작성 화면에서 올리고 게시하지 않은 이미지와 만료된 기록을 정리합니다. */
export async function sweepExpired(ctx: AppContext, log: Log): Promise<void> {
  const { db, config } = ctx;
  await db.query('DELETE FROM password_reset_tokens WHERE expires_at < now()');
  await db.query('DELETE FROM refresh_tokens WHERE expires_at < now()');
  const orphans = await db.query<{ key: string }>(
    `SELECT key FROM uploads x WHERE created_at < now() - interval '24 hours'
       AND NOT EXISTS (SELECT 1 FROM post_images i WHERE i.url = $1 || x.key)
       AND NOT EXISTS (SELECT 1 FROM users u WHERE u.avatar_url = $1 || x.key)
     LIMIT 200`,
    [`${config.mediaBaseUrl}/`],
  );
  await releaseMedia(ctx, orphans.map(({ key }) => `${config.mediaBaseUrl}/${key}`), log);
}
