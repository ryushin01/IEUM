import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';
import { hashPassword } from './auth.ts';
import type { Config } from './config.ts';
import type { Db } from './db.ts';

/** 로컬 실행·E2E·심사용 가상 데이터입니다. 이미 계정이 있으면 건너뜁니다. */
const PEOPLE: { email: string; nickname: string; bio: string; interests: string[]; official: boolean }[] = [
  { email: 'demo@ieum.app', nickname: '이음데모', bio: '오늘 하루를 사진으로 잇습니다.', interests: ['trip', 'music'], official: false },
  { email: 'haneul@ieum.app', nickname: '하늘빛', bio: '산책과 필름 사진', interests: ['camping'], official: true },
  { email: 'sora@ieum.app', nickname: '소라_기록', bio: '바다 근처에 살아요.', interests: ['trip', 'cooking', 'fashion'], official: false },
];

const POSTS: [number, string, [string, string][]][] = [
  [1, '퇴근길 하늘이 유난히 예뻤던 날.\n다들 오늘 하루 어땠나요?', [['노을빛 그러데이션 이미지', '#ff9a8b,#6a5acd'], ['보랏빛 저녁 하늘 이미지', '#6a5acd,#1b1b3a']]],
  [2, '아침 바다는 언제 봐도 좋네요 🌊', [['푸른 바다색 그러데이션 이미지', '#a1ffce,#1e6091']]],
  [0, '이음에 올리는 첫 기록입니다. 새싹처럼 천천히 자라 볼게요.', [['연둣빛 새싹색 그러데이션 이미지', '#c4e538,#2e7d32']]],
];

export async function seed(db: Db, config: Config): Promise<void> {
  const [existing] = await db.query('SELECT 1 FROM users WHERE email = $1', [PEOPLE[0]!.email]);
  if (existing) return;
  await mkdir(config.uploadDir, { recursive: true });
  const passwordHash = await hashPassword('ieum-demo-1234');
  const ids: string[] = [];
  for (const person of PEOPLE) {
    const [row] = await db.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, nickname, bio, interests, is_official, terms_agreed_at)
       VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING id`,
      [person.email, passwordHash, person.nickname, person.bio, person.interests, person.official],
    );
    ids.push(row!.id);
  }
  let minutesAgo = 5;
  let fileIndex = 0;
  for (const [author, caption, images] of POSTS) {
    const [post] = await db.query<{ id: string }>(
      `INSERT INTO posts (author_id, caption, created_at, updated_at)
       VALUES ($1, $2, now() - ($3 || ' minutes')::interval, now() - ($3 || ' minutes')::interval) RETURNING id`,
      [ids[author], caption, minutesAgo],
    );
    minutesAgo *= 12;
    for (const [position, [alt, colors]] of images.entries()) {
      const name = `seed-${++fileIndex}.png`;
      const [from, to] = colors.split(',') as [string, string];
      await writeFile(join(config.uploadDir, name), gradientPng(from, to));
      await db.query('INSERT INTO post_images (post_id, position, url, alt) VALUES ($1, $2, $3, $4)', [
        post!.id, position, `${config.publicBaseUrl}/uploads/${name}`, alt,
      ]);
    }
    await db.query('INSERT INTO likes (post_id, user_id) SELECT $1, id FROM users', [post!.id]);
    await db.query('INSERT INTO comments (post_id, author_id, body) VALUES ($1, $2, $3)', [
      post!.id, ids[(author + 1) % ids.length], '분위기가 정말 좋아요!',
    ]);
  }
  // 운영자 화면 확인용 계정입니다.
  await db.query(
    `INSERT INTO users (email, password_hash, nickname, is_admin, terms_agreed_at) VALUES ($1, $2, $3, true, now())`,
    ['admin@ieum.app', passwordHash, '이음운영자'],
  );
  const [a, b] = ids[0]! < ids[1]! ? [ids[0], ids[1]] : [ids[1], ids[0]];
  const [conversation] = await db.query<{ id: string }>(
    'INSERT INTO conversations (user_a, user_b) VALUES ($1, $2) RETURNING id', [a, b],
  );
  await db.query('INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)', [
    conversation!.id, ids[1], '안녕하세요! 사진 잘 보고 있어요 :)',
  ]);
}

function gradientPng(from: string, to: string, size = 720): Buffer {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [a, b] = [parse(from), parse(to)];
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const offset = y * (size * 3 + 1);
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      for (let c = 0; c < 3; c++) raw[offset + 1 + x * 3 + c] = Math.round(a[c]! + (b[c]! - a[c]!) * t);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function crc32(buffer: Buffer): number {
  let crc = ~0;
  for (const byte of buffer) {
    crc ^= byte;
    for (let k = 0; k < 8; k++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return ~crc >>> 0;
}
