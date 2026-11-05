import { createHash, randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';
import type { Db } from './db.ts';
import { unauthorized } from './errors.ts';

const scrypt = promisify(scryptCb) as (p: string, s: Buffer, l: number) => Promise<Buffer>;
const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  // 소셜 계정은 비밀번호로 로그인할 수 없습니다.
  if (!stored) return false;
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash!, 'base64');
  const actual = await scrypt(password, Buffer.from(salt!, 'base64'), expected.length);
  return timingSafeEqual(actual, expected);
}

export class Tokens {
  private key: Uint8Array;
  private db: Db;
  constructor(secret: string, db: Db) {
    this.key = new TextEncoder().encode(secret);
    this.db = db;
  }

  signAccess(userId: string): Promise<string> {
    return new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime(ACCESS_TTL)
      .sign(this.key);
  }

  async verifyAccess(token: string): Promise<string> {
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      if (!payload.sub) throw new Error('no sub');
      return payload.sub;
    } catch {
      throw unauthorized();
    }
  }

  async issuePair(userId: string) {
    const refreshToken = randomBytes(32).toString('base64url');
    await this.db.query(
      `INSERT INTO refresh_tokens (token_hash, user_id, expires_at)
       VALUES ($1, $2, now() + interval '${REFRESH_TTL_DAYS} days')`,
      [sha256(refreshToken), userId],
    );
    return { accessToken: await this.signAccess(userId), refreshToken };
  }

  /** 재발급 토큰은 한 번만 쓸 수 있습니다. */
  async rotate(refreshToken: string) {
    const rows = await this.db.query<{ user_id: string }>(
      'DELETE FROM refresh_tokens WHERE token_hash = $1 AND expires_at > now() RETURNING user_id',
      [sha256(refreshToken)],
    );
    if (!rows[0]) throw unauthorized('세션이 만료되었습니다. 다시 로그인해 주세요.');
    return this.issuePair(rows[0].user_id);
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.db.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [sha256(refreshToken)]);
  }
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
