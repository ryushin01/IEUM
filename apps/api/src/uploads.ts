import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import sharp from 'sharp';
import type { AppContext } from './context.ts';
import { badRequest } from './errors.ts';
import { keyFromUrl } from './media.ts';

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_DIMENSION = 2048;
const MAX_INPUT_PIXELS = 50_000_000;

/**
 * 다시 인코딩해 위치 정보(EXIF GPS) 등 메타데이터를 모두 지웁니다.
 * 회전 정보는 지우기 전에 화면에 반영합니다. 진짜 이미지가 아니면 여기서 실패합니다.
 */
export function normalizeImage(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_INPUT_PIXELS })
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

/** 클라이언트가 보낸 형식을 믿지 않고 파일 앞부분으로 판별합니다. SVG는 받지 않습니다. */
function detectImageType(b: Buffer): 'jpg' | 'png' | 'webp' | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  return null;
}

/** 게시글과 프로필에는 이 서비스에 올라간 이미지만 연결할 수 있습니다. */
export function assertUploadedUrl(ctx: AppContext, url: unknown): asserts url is string {
  if (typeof url !== 'string' || !keyFromUrl(ctx, url)) throw badRequest('이미지를 다시 올려 주세요.');
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
    if (!detectImageType(buffer)) throw badRequest('JPG, PNG, WebP 이미지만 올릴 수 있습니다.');
    let image: Buffer;
    try {
      image = await normalizeImage(buffer);
    } catch {
      throw badRequest('이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.');
    }
    const key = `${randomUUID()}.webp`;
    await ctx.storage.put(key, image, 'image/webp');
    await ctx.db.query('INSERT INTO uploads (key) VALUES ($1)', [key]);
    reply.code(201);
    return { url: `${ctx.config.mediaBaseUrl}/${key}` };
  });
}
