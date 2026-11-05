import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FastifyInstance } from 'fastify';
import type { AppContext } from './context.ts';
import { badRequest } from './errors.ts';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** 클라이언트가 보낸 형식을 믿지 않고 파일 앞부분으로 판별합니다. SVG는 받지 않습니다. */
export function detectImageType(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

/** 게시글과 프로필에는 이 서버에 올라간 이미지만 연결할 수 있습니다. */
export function assertUploadedUrl(ctx: AppContext, url: unknown): asserts url is string {
  const prefix = `${ctx.config.publicBaseUrl}/uploads/`;
  if (typeof url !== 'string' || !url.startsWith(prefix) || !/^[\w-]+\.(jpg|png|webp)$/.test(url.slice(prefix.length))) {
    throw badRequest('이미지를 다시 올려 주세요.');
  }
}

export function uploadRoutes(app: FastifyInstance, ctx: AppContext) {
  app.post('/uploads', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (req, reply) => {
    await ctx.requireUser(req);
    const file = await req.file();
    if (!file) throw badRequest('이미지를 선택해 주세요.');
    let buffer: Buffer;
    try {
      buffer = await file.toBuffer();
    } catch {
      throw badRequest('이미지는 10MB까지 올릴 수 있습니다.');
    }
    const type = detectImageType(buffer);
    if (!type) throw badRequest('JPG, PNG, WebP 이미지만 올릴 수 있습니다.');
    const name = `${randomUUID()}.${type}`;
    await mkdir(ctx.config.uploadDir, { recursive: true });
    await writeFile(join(ctx.config.uploadDir, name), buffer);
    reply.code(201);
    return { url: `${ctx.config.publicBaseUrl}/uploads/${name}` };
  });
}
