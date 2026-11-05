import { resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import Fastify from 'fastify';
import { Tokens } from './auth.ts';
import type { Config } from './config.ts';
import { bearerUser, type AppContext } from './context.ts';
import type { Db } from './db.ts';
import { ApiError } from './errors.ts';
import { Hub } from './hub.ts';
import { createOutboxMailer, createSmtpMailer, type Mailer } from './mailer.ts';
import { sweepExpired } from './media.ts';
import { adminRoutes } from './routes/admin.ts';
import { authRoutes } from './routes/auth.ts';
import { passwordRoutes } from './routes/password.ts';
import { createLocalStorage, createS3Storage, type Storage } from './storage.ts';
import { conversationRoutes } from './routes/conversations.ts';
import { postRoutes } from './routes/posts.ts';
import { socialRoutes } from './routes/social.ts';
import { userRoutes } from './routes/users.ts';
import { MAX_UPLOAD_BYTES, uploadRoutes } from './uploads.ts';
import { attachWebSocket } from './ws.ts';

export interface AppDeps {
  mailer?: Mailer;
  storage?: Storage;
}

export async function buildApp(config: Config, db: Db, deps: AppDeps = {}) {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : { redact: ['req.headers.authorization'] },
    bodyLimit: 256 * 1024,
    trustProxy: true,
  });
  const tokens = new Tokens(config.jwtSecret, db);
  const hub = new Hub();
  const storage = deps.storage ?? (config.s3 ? createS3Storage(config.s3) : createLocalStorage(resolve(config.uploadDir)));
  const mailer = deps.mailer ?? (config.smtp ? createSmtpMailer(config.smtp.url, config.smtp.from) : createOutboxMailer(config.mailOutboxDir));
  const ctx: AppContext = { db, tokens, hub, config, storage, mailer, requireUser: bearerUser(tokens, db) };

  await app.register(cors, { origin: config.corsOrigins, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] });
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });
  if (config.rateLimit) await app.register(rateLimit, { global: true, max: 300, timeWindow: '1 minute' });

  // 객체 저장소를 쓰면 이미지는 저장소(CDN)에서 바로 제공합니다.
  if (!config.s3) {
    const uploadRoot = resolve(config.uploadDir);
    await mkdir(uploadRoot, { recursive: true });
    await app.register(fastifyStatic, { root: uploadRoot, prefix: '/uploads/', maxAge: '30d', immutable: true });
  }

  app.setErrorHandler((error: Error & { statusCode?: number; code?: string }, req, reply) => {
    if (error instanceof ApiError) {
      return reply.code(error.statusCode).send({ code: error.code, message: error.message });
    }
    // 잘못된 uuid 형식(22P02)은 없는 대상과 같게 처리합니다.
    if (error.code === '22P02') return reply.code(404).send({ code: 'not_found', message: '찾을 수 없습니다.' });
    // 동시에 같은 값을 넣다 고유 제약에 걸린 경우입니다.
    if (error.code === '23505') return reply.code(409).send({ code: 'conflict', message: '이미 처리된 요청이거나 사용 중인 값입니다.' });
    if (error.statusCode && error.statusCode < 500) {
      const message = error.statusCode === 429 ? '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' : '요청을 확인해 주세요.';
      return reply.code(error.statusCode).send({ code: 'bad_request', message });
    }
    req.log.error(error);
    return reply.code(500).send({ code: 'internal', message: '일시적인 오류가 발생했습니다.' });
  });

  // Apple 콜백은 폼으로 옵니다.
  app.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (_req, body, done) => {
    done(null, Object.fromEntries(new URLSearchParams(body as string)));
  });

  // 본문 없는 요청도 라우트에서 같은 검증 오류로 처리합니다.
  app.addHook('preHandler', async (req) => {
    if (req.body === undefined || req.body === null) req.body = {};
  });

  app.get('/health', async () => {
    await db.query('SELECT 1');
    return { ok: true };
  });

  authRoutes(app, ctx);
  socialRoutes(app, ctx);
  passwordRoutes(app, ctx);
  adminRoutes(app, ctx);
  userRoutes(app, ctx);
  postRoutes(app, ctx);
  conversationRoutes(app, ctx);
  uploadRoutes(app, ctx);

  const wss = attachWebSocket(app.server, hub, tokens);
  const sweep = setInterval(() => void sweepExpired(ctx, app.log).catch((failure: Error) => {
    app.log.error({ message: failure.message }, 'sweep failed');
  }), 60 * 60 * 1000);
  sweep.unref();
  app.addHook('onClose', async () => {
    clearInterval(sweep);
    for (const client of wss.clients) client.terminate();
    wss.close();
  });
  return app;
}
