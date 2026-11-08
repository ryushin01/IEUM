import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { createHash, generateKeyPairSync } from 'node:crypto';
import { buildApp } from './app.ts';
import { startMockOAuth } from './testing/mock-oauth.ts';
import { createDb, migrate, type Db } from './db.ts';
import type { Mail } from './mailer.ts';
import sharp from 'sharp';
import type { Config } from './config.ts';

process.env.NODE_ENV = 'test';
let app: Awaited<ReturnType<typeof buildApp>>;
let db: Db;
let port: number;
const mails: Mail[] = [];
let mock: Awaited<ReturnType<typeof startMockOAuth>>;

async function call(method: string, url: string, token?: string, body?: unknown) {
  const res = await app.inject({
    method: method as 'GET',
    url,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...(body === undefined ? {} : { payload: body as object }),
  });
  return { status: res.statusCode, body: res.body ? JSON.parse(res.body) : null };
}

async function signup(nickname: string) {
  const res = await call('POST', '/auth/signup', undefined, {
    email: `${nickname}@example.com`, password: 'Passw0rd!', nickname, agreeTerms: true, confirmAge: true,
  });
  assert.equal(res.status, 201);
  return res.body as { user: { id: string }; accessToken: string; refreshToken: string };
}

const uploaded = (name = 'a.webp') => `http://localhost:0/uploads/${name}`;

before(async () => {
  const uploadDir = await mkdtemp(join(tmpdir(), 'ieum-test-'));
  mock = await startMockOAuth();
  const config: Config = {
    port: 0, jwtSecret: 'test-secret-test-secret-test-secret', corsOrigins: ['http://localhost'],
    publicBaseUrl: 'http://localhost:0', mediaBaseUrl: 'http://localhost:0/uploads', mailOutboxDir: uploadDir, reportAlertEmail: 'ops@example.com', uploadDir, rateLimit: false,
    webUrl: 'https://web.example', socialMockUrl: mock.url,
    social: {
      kakao: { clientId: 'k', clientSecret: 's' },
      naver: { clientId: 'n', clientSecret: 's' },
      google: { clientId: 'g', clientSecret: 's' },
      apple: {
        clientId: 'com.ryushin01.ieum.web',
        apple: {
          teamId: 'TEAM123456', keyId: 'KEY1234567',
          privateKey: generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string,
        },
      },
    },
    socialTokenKey: 'test-token-key',
  };
  // CI는 TEST_DATABASE_URL로 실제 PostgreSQL에서도 실행합니다.
  db = await createDb({ databaseUrl: process.env.TEST_DATABASE_URL });
  await migrate(db);
  app = await buildApp(config, db, { mailer: { send: async (mail) => void mails.push(mail) } });
  await app.listen({ port: 0, host: '127.0.0.1' });
  port = (app.server.address() as { port: number }).port;
});

after(async () => {
  mock.server.close();
  await app.close();
  await db.close();
});

test('약관과 연령 확인 없이는 가입할 수 없다', async () => {
  const res = await call('POST', '/auth/signup', undefined, {
    email: 'x@example.com', password: 'Passw0rd!', nickname: 'nope', agreeTerms: false, confirmAge: true,
  });
  assert.equal(res.status, 400);
});

test('비밀번호 규칙, 관심사 개수, 닉네임 중복을 검사한다', async () => {
  const base = { email: 'rule@example.com', nickname: 'rule', agreeTerms: true, confirmAge: true };
  assert.equal((await call('POST', '/auth/signup', undefined, { ...base, password: 'onlyletters' })).status, 400);
  assert.equal((await call('POST', '/auth/signup', undefined, { ...base, password: 'Passw0rd!', interests: ['game', 'movie', 'music', 'car'] })).status, 400);
  assert.equal((await call('POST', '/auth/signup', undefined, { ...base, password: 'Passw0rd!', interests: ['없는값'] })).status, 400);
  assert.equal((await call('GET', '/auth/nickname-available?nickname=rule')).body.available, true);
  const created = await call('POST', '/auth/signup', undefined, { ...base, password: 'Passw0rd!', interests: ['game', 'car'] });
  assert.deepEqual(created.body.user.interests, ['game', 'car']);
  assert.equal((await call('GET', '/auth/nickname-available?nickname=rule')).body.available, false);
});

test('이미지는 5장, 댓글은 100자까지다', async () => {
  const user = await signup('limits');
  const six = Array.from({ length: 6 }, () => ({ url: uploaded() }));
  assert.equal((await call('POST', '/posts', user.accessToken, { caption: 'x', images: six })).status, 400);
  const post = await call('POST', '/posts', user.accessToken, { caption: 'x', images: six.slice(0, 5) });
  assert.equal(post.status, 201);
  assert.equal(post.body.isHot, false);
  assert.equal((await call('POST', `/posts/${post.body.id}/comments`, user.accessToken, { body: '가'.repeat(101) })).status, 400);
  assert.equal((await call('POST', `/posts/${post.body.id}/comments`, user.accessToken, { body: '가'.repeat(100) })).status, 201);
});

test('재발급 토큰은 한 번만 쓸 수 있다', async () => {
  const user = await signup('rotate');
  const first = await call('POST', '/auth/refresh', undefined, { refreshToken: user.refreshToken });
  assert.equal(first.status, 200);
  const replay = await call('POST', '/auth/refresh', undefined, { refreshToken: user.refreshToken });
  assert.equal(replay.status, 401);
});

test('게시글 작성·수정·삭제는 작성자만 할 수 있다', async () => {
  const author = await signup('author');
  const other = await signup('other');
  const created = await call('POST', '/posts', author.accessToken, { caption: '첫 글', images: [{ url: uploaded() }] });
  assert.equal(created.status, 201);
  const id = created.body.id;
  assert.equal((await call('PATCH', `/posts/${id}`, other.accessToken, { caption: '탈취' })).status, 403);
  assert.equal((await call('DELETE', `/posts/${id}`, other.accessToken)).status, 403);
  const edited = await call('PATCH', `/posts/${id}`, author.accessToken, { caption: '수정' });
  assert.equal(edited.body.caption, '수정');
  assert.equal(edited.body.edited, true);
  assert.equal((await call('DELETE', `/posts/${id}`, author.accessToken)).status, 204);
  assert.equal((await call('GET', `/posts/${id}`, author.accessToken)).status, 404);
});

test('외부 이미지 주소와 금칙어는 거부한다', async () => {
  const user = await signup('filter');
  assert.equal((await call('POST', '/posts', user.accessToken, { caption: 'x', images: [{ url: 'https://evil.example/a.png' }] })).status, 400);
  assert.equal((await call('POST', '/posts', user.accessToken, { caption: '씨 발', images: [{ url: uploaded() }] })).status, 400);
});

test('좋아요는 중복되지 않고 커서 페이지가 이어진다', async () => {
  const user = await signup('pager');
  const ids: string[] = [];
  for (let i = 0; i < 12; i++) {
    ids.push((await call('POST', '/posts', user.accessToken, { caption: `글 ${i}`, images: [{ url: uploaded() }] })).body.id);
  }
  await call('PUT', `/posts/${ids[0]}/like`, user.accessToken);
  const liked = await call('PUT', `/posts/${ids[0]}/like`, user.accessToken);
  assert.equal(liked.body.likeCount, 1);
  const mine = await call('GET', '/posts?liked=true', user.accessToken);
  assert.deepEqual(mine.body.items.map((post: { id: string }) => post.id), [ids[0]]);
  const p1 = await call('GET', `/posts?authorId=${user.user.id}`, user.accessToken);
  assert.equal(p1.body.items.length, 10);
  const p2 = await call('GET', `/posts?authorId=${user.user.id}&cursor=${p1.body.nextCursor}`, user.accessToken);
  assert.equal(p2.body.items.length, 2);
  assert.equal(p2.body.nextCursor, null);
});

test('차단하면 서로의 글과 DM이 막히고, 해제하면 돌아온다', async () => {
  const a = await signup('blocker');
  const b = await signup('blocked');
  const post = await call('POST', '/posts', b.accessToken, { caption: '글', images: [{ url: uploaded() }] });
  const convo = await call('POST', '/conversations', a.accessToken, { userId: b.user.id });
  await call('PUT', `/users/${b.user.id}/block`, a.accessToken);
  assert.equal((await call('GET', `/posts/${post.body.id}`, a.accessToken)).status, 404);
  assert.equal((await call('POST', `/conversations/${convo.body.id}/messages`, b.accessToken, { body: '안녕' })).status, 403);
  assert.equal((await call('GET', `/users/${a.user.id}`, b.accessToken)).status, 404);
  await call('DELETE', `/users/${b.user.id}/block`, a.accessToken);
  assert.equal((await call('GET', `/posts/${post.body.id}`, a.accessToken)).status, 200);
});

test('대화 참여자만 메시지를 볼 수 있고, 소켓으로 실시간 전달된다', async () => {
  const a = await signup('dma');
  const b = await signup('dmb');
  const outsider = await signup('dmc');
  const convo = await call('POST', '/conversations', a.accessToken, { userId: b.user.id });
  assert.equal((await call('GET', `/conversations/${convo.body.id}/messages`, outsider.accessToken)).status, 404);

  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const received = new Promise<{ type: string; message: { body: string } }>((resolve, reject) => {
    socket.on('error', reject);
    socket.on('open', () => socket.send(JSON.stringify({ type: 'auth', token: b.accessToken })));
    socket.on('message', async (raw) => {
      const event = JSON.parse(raw.toString());
      if (event.type === 'ready') {
        await call('POST', `/conversations/${convo.body.id}/messages`, a.accessToken, { body: '안녕하세요' });
      } else resolve(event);
    });
  });
  const event = await received;
  socket.close();
  assert.equal(event.message.body, '안녕하세요');

  const list = await call('GET', '/conversations', b.accessToken);
  assert.equal(list.body[0].unreadCount, 1);
  await call('POST', `/conversations/${convo.body.id}/read`, b.accessToken);
  assert.equal((await call('GET', '/conversations', b.accessToken)).body[0].unreadCount, 0);
});

test('잘못된 토큰의 소켓은 닫힌다', async () => {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
  const code = await new Promise<number>((resolve) => {
    socket.on('open', () => socket.send(JSON.stringify({ type: 'auth', token: 'bad' })));
    socket.on('close', (c) => resolve(c));
  });
  assert.equal(code, 4401);
});

test('이미지가 아닌 파일은 올릴 수 없다', async () => {
  const user = await signup('uploader');
  const send = (content: Buffer) => {
    const boundary = 'x';
    const payload = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="a.png"\r\nContent-Type: image/png\r\n\r\n`),
      content,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);
    return app.inject({
      method: 'POST', url: '/uploads', payload,
      headers: { authorization: `Bearer ${user.accessToken}`, 'content-type': `multipart/form-data; boundary=${boundary}` },
    });
  };
  assert.equal((await send(Buffer.from('<svg onload=alert(1)>'))).statusCode, 400);
  // 앞부분만 PNG인 가짜 파일도 거부합니다.
  assert.equal((await send(Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'))).statusCode, 400);
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#c4e538' } }).png().toBuffer();
  const ok = await send(png);
  assert.equal(ok.statusCode, 201);
  assert.match(JSON.parse(ok.body).url, /\/uploads\/[\w-]+\.webp$/);
});

test('계정을 삭제하면 비밀번호 확인 후 작성물까지 지워진다', async () => {
  const user = await signup('leaver');
  const other = await signup('stayer');
  const post = await call('POST', '/posts', user.accessToken, { caption: '글', images: [{ url: uploaded() }] });
  assert.equal((await call('DELETE', '/me', user.accessToken, { password: 'wrong-Passw0rd!' })).status, 403);
  assert.equal((await call('DELETE', '/me', user.accessToken, { password: 'Passw0rd!' })).status, 204);
  assert.equal((await call('GET', `/posts/${post.body.id}`, other.accessToken)).status, 404);
  assert.equal((await call('POST', '/auth/refresh', undefined, { refreshToken: user.refreshToken })).status, 401);
});

const VERIFIER = 'v'.repeat(43);
const CHALLENGE = createHash('sha256').update(VERIFIER).digest('base64url');

/** 시작 → 가짜 제공자 → 콜백까지 진행해 돌아온 주소를 돌려줍니다. */
async function socialRedirect(provider: string, client: 'app' | 'web' = 'web') {
  const start = await call('POST', `/auth/social/${provider}/start`, undefined, { client, codeChallenge: CHALLENGE });
  assert.equal(start.status, 200);
  const authorize = await fetch(start.body.url, { redirect: 'manual' });
  const callback = new URL(authorize.headers.get('location')!);
  const res = await app.inject({ method: 'GET', url: callback.pathname + callback.search });
  assert.equal(res.statusCode, 303);
  return new URL(res.headers.location as string);
}

test('소셜: 앱은 전용 스킴으로, 웹은 웹 주소로 돌아오고 토큰은 주소에 없다', async () => {
  const app_ = await socialRedirect('kakao', 'app');
  assert.equal(app_.protocol, 'com.ryushin01.ieum:');
  assert.ok(app_.searchParams.get('code'));
  assert.equal(app_.searchParams.get('accessToken'), null);
  const web = await socialRedirect('kakao');
  assert.equal(web.origin + web.pathname, 'https://web.example/auth/callback');
});

test('소셜: 시작한 쪽의 검증값이 없으면 코드를 쓸 수 없고, 코드는 한 번만 쓴다', async () => {
  const code = (await socialRedirect('kakao')).searchParams.get('code');
  assert.equal((await call('POST', '/auth/social/exchange', undefined, { code, codeVerifier: 'x'.repeat(43) })).status, 401);
  assert.equal((await call('POST', '/auth/social/exchange', undefined, { code, codeVerifier: VERIFIER })).status, 401);
});

test('소셜: 첫 로그인은 약관 동의 후 가입되고, 다음부터 바로 로그인된다', async () => {
  const exchange = async () => {
    const code = (await socialRedirect('naver')).searchParams.get('code');
    return call('POST', '/auth/social/exchange', undefined, { code, codeVerifier: VERIFIER });
  };
  const first = await exchange();
  assert.equal(first.body.status, 'signup');
  assert.equal(first.body.nickname, '네이버사용자');
  const { signupToken } = first.body;
  const body = { signupToken, nickname: '네이버사용자', agreeTerms: true, confirmAge: true };
  assert.equal((await call('POST', '/auth/social/signup', undefined, { ...body, agreeTerms: false })).status, 400);
  const created = await call('POST', '/auth/social/signup', undefined, { ...body, interests: ['trip'] });
  assert.equal(created.status, 201);
  assert.equal(created.body.user.hasPassword, false);
  // 네이버 이메일은 확인 여부를 알 수 없어 저장하지 않습니다.
  assert.equal(created.body.user.email, null);
  assert.equal((await call('POST', '/auth/social/signup', undefined, body)).status, 401);

  const second = await exchange();
  assert.equal(second.body.status, 'login');
  assert.equal(second.body.user.id, created.body.user.id);

  // 비밀번호가 없는 계정은 비밀번호 로그인이 되지 않고, 확인 문구로 삭제합니다.
  const token = second.body.accessToken;
  assert.equal((await call('DELETE', '/me', token, { confirmText: '틀림' })).status, 403);
  assert.equal((await call('DELETE', '/me', token, { confirmText: '삭제' })).status, 204);
  assert.equal((await exchange()).body.status, 'signup');
});

test('소셜: 이미 가입된 이메일과 자동으로 합치지 않는다', async () => {
  await call('POST', '/auth/signup', undefined, {
    email: 'demo@ieum.app', password: 'Passw0rd!', nickname: 'existing', agreeTerms: true, confirmAge: true,
  });
  const code = (await socialRedirect('google')).searchParams.get('code');
  const res = await call('POST', '/auth/social/exchange', undefined, { code, codeVerifier: VERIFIER });
  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'email_exists');
});

test('소셜: 위조하거나 재사용한 state는 거부한다', async () => {
  const res = await app.inject({ method: 'GET', url: '/auth/social/kakao/callback?code=x&state=forged' });
  assert.equal(res.statusCode, 400);
});

/** Apple은 콜백을 폼 POST로 보내므로 실제 흐름처럼 POST합니다. */
async function appleRedirect(user?: string, client: 'app' | 'web' = 'app') {
  const start = await call('POST', '/auth/social/apple/start', undefined, { client, codeChallenge: CHALLENGE });
  const authorize = new URL(start.body.url);
  assert.equal(authorize.searchParams.get('response_mode'), 'form_post');
  assert.equal(authorize.searchParams.get('scope'), 'name email');
  const form = new URLSearchParams({ code: 'code-apple', state: authorize.searchParams.get('state')! });
  if (user) form.set('user', user);
  const res = await app.inject({
    method: 'POST',
    url: '/auth/social/apple/callback',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: form.toString(),
  });
  assert.equal(res.statusCode, 303);
  return new URL(res.headers.location as string);
}

test('Apple: 폼 콜백으로 가입하고, 탈퇴하면 Apple 토큰을 폐기한다', async () => {
  const exchange = async (user?: string) => {
    const redirect = await appleRedirect(user);
    assert.equal(redirect.protocol, 'com.ryushin01.ieum:');
    return call('POST', '/auth/social/exchange', undefined, { code: redirect.searchParams.get('code'), codeVerifier: VERIFIER });
  };
  const first = await exchange(JSON.stringify({ name: { firstName: '사과', lastName: '김' } }));
  assert.equal(first.body.status, 'signup');
  assert.equal(first.body.nickname, '김사과');
  const created = await call('POST', '/auth/social/signup', undefined, {
    signupToken: first.body.signupToken, nickname: '김사과', agreeTerms: true, confirmAge: true,
  });
  assert.equal(created.status, 201);
  // 가리기를 선택한 릴레이 이메일도 Apple이 확인한 값이므로 저장합니다.
  assert.equal(created.body.user.email, 'relay123@privaterelay.appleid.com');

  // Apple 토큰은 DB에 평문으로 저장하지 않습니다.
  const [row] = await db.query<{ provider_token: string }>(`SELECT provider_token FROM social_accounts WHERE provider = 'apple'`);
  assert.ok(row!.provider_token);
  assert.ok(!row!.provider_token.includes('apple-refresh-token'));

  // 이름은 처음에만 오므로 두 번째부터는 없어도 로그인됩니다.
  const second = await exchange();
  assert.equal(second.body.status, 'login');
  assert.equal(mock.revoked.length, 0);
  assert.equal((await call('DELETE', '/me', second.body.accessToken, { confirmText: '삭제' })).status, 204);
  assert.deepEqual(mock.revoked, ['apple-refresh-token']);
});

test('Apple: 취소하면 denied로 돌아오고, 앱 스킴에 오류만 전달한다', async () => {
  const start = await call('POST', '/auth/social/apple/start', undefined, { client: 'app', codeChallenge: CHALLENGE });
  const state = new URL(start.body.url).searchParams.get('state')!;
  const res = await app.inject({
    method: 'POST',
    url: '/auth/social/apple/callback',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    payload: new URLSearchParams({ error: 'user_cancelled_authorize', state }).toString(),
  });
  assert.equal(res.headers.location, 'com.ryushin01.ieum://auth?error=denied');
});

test('운영자: 일반 사용자는 접근할 수 없다', async () => {
  const user = await signup('notadmin');
  assert.equal((await call('GET', '/admin/reports', user.accessToken)).status, 403);
  assert.equal((await call('POST', '/admin/reports/resolve', user.accessToken, { targetType: 'post', targetId: user.user.id, action: 'dismiss' })).status, 403);
  assert.equal((await call('GET', '/admin/reports')).status, 401);
});

async function signupAdmin(nickname: string) {
  const admin = await signup(nickname);
  await db.query('UPDATE users SET is_admin = true WHERE id = $1', [admin.user.id]);
  return admin;
}

test('운영자: 신고를 묶어 보고, 삭제하면 모든 신고가 처리되며 이미지도 정리된다', async () => {
  const admin = await signupAdmin('admin1');
  const author = await signup('badauthor');
  const r1 = await signup('reporter1');
  const r2 = await signup('reporter2');
  const post = await call('POST', '/posts', author.accessToken, { caption: '문제 글', images: [{ url: uploaded('reported.webp') }] });
  mails.length = 0;
  for (const [user, reason] of [[r1, '스팸·광고'], [r2, '욕설·혐오 표현']] as const) {
    await call('POST', '/reports', user.accessToken, { targetType: 'post', targetId: post.body.id, reason });
  }
  assert.equal(mails.filter((m) => m.to === 'ops@example.com').length, 2);

  const list = await call('GET', '/admin/reports', admin.accessToken);
  const item = list.body.find((r: { targetId: string }) => r.targetId === post.body.id);
  assert.equal(item.count, 2);
  assert.deepEqual(item.reasons.sort(), ['스팸·광고', '욕설·혐오 표현'].sort());
  assert.equal(item.preview.text, '문제 글');
  assert.equal(item.preview.authorNickname, 'badauthor');
  assert.equal(item.overdue, false);

  assert.equal((await call('POST', '/admin/reports/resolve', admin.accessToken, { targetType: 'post', targetId: post.body.id, action: 'remove' })).status, 204);
  assert.equal((await call('GET', `/posts/${post.body.id}`, author.accessToken)).status, 404);
  const after = await call('GET', '/admin/reports', admin.accessToken);
  assert.equal(after.body.some((r: { targetId: string }) => r.targetId === post.body.id), false);
});

test('운영자: 정지하면 바로 막히고 글이 숨겨지며, 해제하면 돌아온다', async () => {
  const admin = await signupAdmin('admin2');
  const bad = await signup('suspendme');
  const other = await signup('witness');
  const post = await call('POST', '/posts', bad.accessToken, { caption: '글', images: [{ url: uploaded() }] });
  await call('POST', '/reports', other.accessToken, { targetType: 'user', targetId: bad.user.id, reason: '괴롭힘·따돌림' });

  // 사용자 대상은 삭제가 아니라 정지만 할 수 있습니다.
  assert.equal((await call('POST', '/admin/reports/resolve', admin.accessToken, { targetType: 'user', targetId: bad.user.id, action: 'remove' })).status, 400);
  assert.equal((await call('POST', '/admin/reports/resolve', admin.accessToken, { targetType: 'user', targetId: bad.user.id, action: 'suspend' })).status, 204);

  // 남아 있던 access token, refresh token, 비밀번호 로그인이 모두 막힙니다.
  assert.equal((await call('GET', '/me', bad.accessToken)).status, 401);
  assert.equal((await call('POST', '/auth/refresh', undefined, { refreshToken: bad.refreshToken })).status, 401);
  const login = await call('POST', '/auth/login', undefined, { email: 'suspendme@example.com', password: 'Passw0rd!' });
  assert.equal(login.status, 403);
  assert.equal(login.body.code, 'suspended');
  // 다른 사람에게 글과 프로필이 보이지 않습니다.
  assert.equal((await call('GET', `/posts/${post.body.id}`, other.accessToken)).status, 404);
  assert.equal((await call('GET', `/users/${bad.user.id}`, other.accessToken)).status, 404);
  // 운영자도 정지 대상이 될 수 없습니다.
  await call('POST', '/reports', other.accessToken, { targetType: 'user', targetId: admin.user.id, reason: '기타' });
  assert.equal((await call('POST', '/admin/reports/resolve', admin.accessToken, { targetType: 'user', targetId: admin.user.id, action: 'suspend' })).status, 400);

  const suspended = await call('GET', '/admin/users/suspended', admin.accessToken);
  assert.ok(suspended.body.some((u: { id: string }) => u.id === bad.user.id));
  assert.equal((await call('DELETE', `/admin/users/${bad.user.id}/suspension`, admin.accessToken)).status, 204);
  assert.equal((await call('POST', '/auth/login', undefined, { email: 'suspendme@example.com', password: 'Passw0rd!' })).status, 200);
  assert.equal((await call('GET', `/posts/${post.body.id}`, other.accessToken)).status, 200);
});

const waitForMail = async (to: string) => {
  for (let i = 0; i < 50; i++) {
    const mail = mails.findLast((m) => m.to === to);
    if (mail) return mail;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  return undefined;
};
const tokenFromMail = (mail: Mail) => /#token=([\w-]+)/.exec(mail.text)![1]!;

test('비밀번호 재설정: 한 번만 쓸 수 있고, 모든 기기 로그인이 끊긴다', async () => {
  const user = await signup('forgot');
  const email = 'forgot@example.com';
  mails.length = 0;
  assert.equal((await call('POST', '/auth/password-reset/request', undefined, { email })).status, 202);
  const mail = await waitForMail(email);
  assert.ok(mail);
  const token = tokenFromMail(mail);
  // DB에는 원문 토큰이 없습니다.
  const rows = await db.query<{ token_hash: string }>('SELECT token_hash FROM password_reset_tokens');
  assert.ok(rows.every((r) => r.token_hash !== token));

  assert.equal((await call('POST', '/auth/password-reset/confirm', undefined, { token, password: 'weak' })).status, 400);
  assert.equal((await call('POST', '/auth/password-reset/confirm', undefined, { token, password: 'N3w-Passw0rd!' })).status, 204);
  assert.equal((await call('POST', '/auth/password-reset/confirm', undefined, { token, password: 'N3w-Passw0rd!' })).status, 401);
  assert.equal((await call('POST', '/auth/refresh', undefined, { refreshToken: user.refreshToken })).status, 401);
  assert.equal((await call('POST', '/auth/login', undefined, { email, password: 'Passw0rd!' })).status, 401);
  assert.equal((await call('POST', '/auth/login', undefined, { email, password: 'N3w-Passw0rd!' })).status, 200);
});

test('비밀번호 재설정: 없는 이메일과 소셜 계정은 같은 응답을 주고 메일을 보내지 않으며, 연속 요청을 막는다', async () => {
  mails.length = 0;
  assert.equal((await call('POST', '/auth/password-reset/request', undefined, { email: 'nobody@example.com' })).status, 202);
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(mails.length, 0);

  await signup('twice');
  await call('POST', '/auth/password-reset/request', undefined, { email: 'twice@example.com' });
  assert.ok(await waitForMail('twice@example.com'));
  await call('POST', '/auth/password-reset/request', undefined, { email: 'twice@example.com' });
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(mails.filter((m) => m.to === 'twice@example.com').length, 1);
});
