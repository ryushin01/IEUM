import type { FastifyRequest } from 'fastify';
import type { Tokens } from './auth.ts';
import type { Config } from './config.ts';
import type { Db } from './db.ts';
import { unauthorized } from './errors.ts';
import type { Hub } from './hub.ts';

export interface AppContext {
  db: Db;
  tokens: Tokens;
  hub: Hub;
  config: Config;
  requireUser(req: FastifyRequest): Promise<string>;
}

export function bearerUser(tokens: Tokens) {
  return async (req: FastifyRequest): Promise<string> => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw unauthorized();
    return tokens.verifyAccess(header.slice(7));
  };
}
