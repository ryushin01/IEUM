import type { FastifyRequest } from 'fastify';
import type { Tokens } from './auth.ts';
import type { Config } from './config.ts';
import type { Db } from './db.ts';
import { unauthorized } from './errors.ts';
import type { Hub } from './hub.ts';
import type { Mailer } from './mailer.ts';
import type { Storage } from './storage.ts';

export interface AppContext {
  db: Db;
  tokens: Tokens;
  hub: Hub;
  config: Config;
  storage: Storage;
  mailer: Mailer;
  requireUser(req: FastifyRequest): Promise<string>;
}

/** 정지된 계정은 access token이 남아 있어도 바로 막습니다. */
export function bearerUser(tokens: Tokens, db: Db) {
  return async (req: FastifyRequest): Promise<string> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();
    const userId = await tokens.verifyAccess(header.slice(7));
    const [user] = await db.query('SELECT 1 FROM users WHERE id = $1 AND suspended_at IS NULL', [userId]);
    if (!user) throw unauthorized();
    return userId;
  };
}
