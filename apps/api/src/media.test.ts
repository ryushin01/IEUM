import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type Server } from 'node:http';
import { mkdtemp, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { buildApp } from './app.ts';
import type { Config } from './config.ts';
import { createDb, migrate, type Db } from './db.ts';
import { sweepExpired } from './media.ts';
import { createS3Storage } from './storage.ts';
import { normalizeImage } from './uploads.ts';

process.env.NODE_ENV = 'test';
process.env.AWS_ACCESS_KEY_ID = 'test';
process.env.AWS_SECRET_ACCESS_KEY = 'test';

const GPS_EXIF = { IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '37/1 33/1 59/1', GPSLongitudeRef: 'E', GPSLongitude: '126/1 58/1 41/1' } };

/** 위치 정보와 회전 정보가 든 실제 JPEG입니다. */
const photoWithGps = (orientation = 1) =>
  sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#336699' } })
    .jpeg()
    .withExif(GPS_EXIF)
    .withMetadata({ orientation })
    .toBuffer();

test('위치 정보를 지우고, 회전을 반영하며, 긴 변을 줄인다', async () => {
  const input = await photoWithGps(6);
  const before_ = await sharp(input).metadata();
  assert.ok(before_.exif, '테스트 입력에 EXIF가 있어야 합니다.');
  assert.ok(input.includes(Buffer.from('37/1')) || before_.exif.length > 20);

  const output = await normalizeImage(input);
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.exif, undefined);
  assert.equal(meta.icc, undefined);
  assert.equal(meta.xmp, undefined);
  assert.equal(meta.orientation, undefined);
  // 90도 회전 정보(6)가 픽셀에 반영되어 세로로 길어집니다.
  assert.equal(meta.width, 683);
  assert.equal(meta.height, 2048);
});

let app: Awaited<ReturnType<typeof buildApp>>;
let db: Db;
let uploadDir: string;
let token: string;
const BASE = 'http://localhost:0/uploads';

async function json(method: string, url: string, body?: object) {
  const res = await app.inject({
    method: method as 'GET', url,
    headers: { authorization: `Bearer ${token}` },
    ...(body ? { payload: body } : {}),
  });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}

async function upload(buffer: Buffer): Promise<string> {
  const payload = Buffer.concat([
    Buffer.from('--x\r\nContent-Disposition: form-data; name="file"; filename="a.jpg"\r\nContent-Type: image/jpeg\r\n\r\n'),
    buffer,
    Buffer.from('\r\n--x--\r\n'),
  ]);
  const res = await app.inject({
    method: 'POST', url: '/uploads', payload,
    headers: { authorization: `Bearer ${token}`, 'content-type': 'multipart/form-data; boundary=x' },
  });
  assert.equal(res.statusCode, 201);
  return JSON.parse(res.body).url;
}

before(async () => {
  uploadDir = await mkdtemp(join(tmpdir(), 'ieum-media-'));
  const config: Config = {
    port: 0, jwtSecret: 'test-secret-test-secret-test-secret', corsOrigins: [], publicBaseUrl: 'http://localhost:0',
    mediaBaseUrl: BASE, mailOutboxDir: uploadDir, uploadDir, rateLimit: false, webUrl: 'https://web.example', social: {}, socialTokenKey: 'k',
  };
  // CI는 TEST_DATABASE_URL로 실제 PostgreSQL에서도 실행합니다.
  db = await createDb({ databaseUrl: process.env.TEST_DATABASE_URL });
  await migrate(db);
  app = await buildApp(config, db, { mailer: { send: async () => {} } });
  const res = await app.inject({
    method: 'POST', url: '/auth/signup',
    payload: { email: 'media@example.com', password: 'Passw0rd!', nickname: 'media', agreeTerms: true, confirmAge: true },
  });
  token = JSON.parse(res.body).accessToken;
});

after(async () => {
  await app.close();
  await db.close();
});

const files = () => readdir(uploadDir);
const fileOf = (url: string) => url.slice(BASE.length + 1);

test('업로드한 파일에는 위치 정보가 없다', async () => {
  const url = await upload(await photoWithGps());
  const stored = await readFile(join(uploadDir, fileOf(url)));
  assert.equal((await sharp(stored).metadata()).exif, undefined);
  assert.equal(stored.includes(Buffer.from('37/1')), false);
});

test('게시글을 지우면 이미지도 지워진다', async () => {
  const url = await upload(await photoWithGps());
  const post = await json('POST', '/posts', { caption: '글', images: [{ url }] });
  assert.ok((await files()).includes(fileOf(url)));
  assert.equal((await json('DELETE', `/posts/${post.body.id}`)).status, 204);
  assert.equal((await files()).includes(fileOf(url)), false);
});

test('다른 곳에서 쓰는 이미지는 지우지 않는다', async () => {
  const url = await upload(await photoWithGps());
  const a = await json('POST', '/posts', { caption: 'a', images: [{ url }] });
  await json('POST', '/posts', { caption: 'b', images: [{ url }] });
  await json('DELETE', `/posts/${a.body.id}`);
  assert.ok((await files()).includes(fileOf(url)));
});

test('프로필 사진을 바꾸면 이전 사진이 지워진다', async () => {
  const first = await upload(await photoWithGps());
  const second = await upload(await photoWithGps());
  await json('PATCH', '/me', { avatarUrl: first });
  await json('PATCH', '/me', { avatarUrl: second });
  const names = await files();
  assert.equal(names.includes(fileOf(first)), false);
  assert.ok(names.includes(fileOf(second)));
});

test('게시하지 않은 이미지는 24시간 뒤 정리하고, 쓰는 이미지는 남긴다', async () => {
  const orphan = await upload(await photoWithGps());
  const used = await upload(await photoWithGps());
  const fresh = await upload(await photoWithGps());
  await json('POST', '/posts', { caption: '글', images: [{ url: used }] });
  await db.query(`UPDATE uploads SET created_at = now() - interval '25 hours' WHERE key = ANY($1)`, [[fileOf(orphan), fileOf(used)]]);
  const ctx = { db, storage: { delete: async (key: string) => (await import('node:fs/promises')).rm(join(uploadDir, key), { force: true }) }, config: { mediaBaseUrl: BASE } };
  await sweepExpired(ctx as never, console);
  const names = await files();
  assert.equal(names.includes(fileOf(orphan)), false);
  assert.ok(names.includes(fileOf(used)));
  assert.ok(names.includes(fileOf(fresh)));
});

test('S3 저장소는 지정한 버킷에 올리고 지운다', async () => {
  const calls: { method: string; url: string; type?: string; cache?: string; bytes: number }[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      calls.push({
        method: req.method!, url: req.url!.split('?')[0]!, type: req.headers['content-type'],
        cache: req.headers['cache-control'], bytes: Buffer.concat(chunks).length,
      });
      res.writeHead(req.method === 'DELETE' ? 204 : 200, { etag: '"x"' }).end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as { port: number };
  try {
    const storage = createS3Storage({ bucket: 'media', region: 'auto', endpoint: `http://127.0.0.1:${port}` });
    await storage.put('a.webp', Buffer.from('hello'), 'image/webp');
    await storage.delete('a.webp');
  } finally {
    server.close();
  }
  assert.deepEqual(calls[0], { method: 'PUT', url: '/media/a.webp', type: 'image/webp', cache: 'public, max-age=31536000, immutable', bytes: 5 });
  assert.equal(calls[1]!.method, 'DELETE');
  assert.equal(calls[1]!.url, '/media/a.webp');
});
