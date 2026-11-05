import { createHash, randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import { hashPassword } from '../auth.ts';
import type { AppContext } from '../context.ts';
import { badRequest, unauthorized } from '../errors.ts';
import { PASSWORD } from './auth.ts';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const RESEND_SECONDS = 60;

export function passwordRoutes(app: FastifyInstance, ctx: AppContext) {
  const { db, config, mailer, hub } = ctx;

  /** 가입 여부를 알 수 없도록 항상 같은 응답을 주고, 메일은 기다리지 않습니다. */
  app.post('/auth/password-reset/request', { config: { rateLimit: { max: 5, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const { email } = req.body as { email?: unknown };
    if (typeof email !== 'string' || email.length > 320) throw badRequest('이메일을 입력해 주세요.');
    void sendResetMail(email.toLowerCase()).catch((failure: Error) => {
      req.log.error({ message: failure.message }, 'password reset mail failed');
    });
    reply.code(202);
    return { ok: true };
  });

  async function sendResetMail(email: string) {
    // 소셜 계정은 비밀번호가 없고, 정지된 계정은 재설정으로 풀 수 없습니다.
    const [user] = await db.query<{ id: string; recent: boolean }>(
      `SELECT u.id, EXISTS (
         SELECT 1 FROM password_reset_tokens t
         WHERE t.user_id = u.id AND t.created_at > now() - interval '${RESEND_SECONDS} seconds'
       ) AS recent
       FROM users u WHERE u.email = $1 AND u.password_hash IS NOT NULL AND u.suspended_at IS NULL`,
      [email],
    );
    if (!user || user.recent) return;
    const token = randomBytes(32).toString('base64url');
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [user.id]);
    await db.query(
      `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, now() + interval '30 minutes')`,
      [sha256(token), user.id],
    );
    // 토큰이 서버 로그에 남지 않도록 주소의 # 뒤에 둡니다.
    await mailer.send({
      to: email,
      subject: '[이음] 비밀번호 재설정 안내',
      text: `아래 링크에서 새 비밀번호를 설정해 주세요. 링크는 30분 동안 한 번만 쓸 수 있습니다.\n\n${config.webUrl}/reset-password#token=${token}\n\n직접 요청하지 않았다면 이 메일을 무시해 주세요. 비밀번호는 바뀌지 않습니다.`,
    });
  }

  app.post('/auth/password-reset/confirm', { config: { rateLimit: { max: 10, timeWindow: '10 minutes' } } }, async (req, reply) => {
    const { token, password } = req.body as { token?: unknown; password?: unknown };
    if (typeof password !== 'string' || !PASSWORD.test(password)) {
      throw badRequest('비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.');
    }
    if (typeof token !== 'string') throw unauthorized('링크가 올바르지 않습니다.');
    const [row] = await db.query<{ user_id: string }>(
      'DELETE FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > now() RETURNING user_id',
      [sha256(token)],
    );
    if (!row) throw unauthorized('링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.');
    await db.query('UPDATE users SET password_hash = $2 WHERE id = $1', [row.user_id, await hashPassword(password)]);
    // 다른 기기의 로그인을 모두 끊습니다.
    await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [row.user_id]);
    hub.disconnect(row.user_id);
    reply.code(204);
  });
}
