/** 운영자 지정: node src/cli/grant-admin.ts admin@example.com [--revoke] */
import { loadConfig } from '../config.ts';
import { createDb, migrate } from '../db.ts';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('사용법: node src/cli/grant-admin.ts <이메일> [--revoke]');
  process.exit(1);
}
const config = loadConfig();
const db = await createDb(config);
await migrate(db);
const rows = await db.query<{ nickname: string }>(
  'UPDATE users SET is_admin = $2 WHERE email = $1 RETURNING nickname',
  [email.toLowerCase(), flag !== '--revoke'],
);
await db.close();
if (!rows[0]) {
  console.error('해당 이메일의 계정이 없습니다. 가입 후 다시 실행해 주세요.');
  process.exit(1);
}
console.log(`${rows[0].nickname}: ${flag === '--revoke' ? '운영자 해제' : '운영자 지정'}`);
