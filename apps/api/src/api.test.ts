import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WebSocket } from 'ws';
import { createHash } from 'node:crypto';
import { buildApp } from './app.ts';
import { startMockOAuth } from './testing/mock-oauth.ts';
import { createDb, migrate, type Db } from './db.ts';
import type { Config } from './config.ts';

process.env.NODE_ENV = 'test';
let app: Awaited<ReturnType<typeof buildApp>>;
let db: Db;
let port: number;
let mock: Awaited<ReturnType<typeof startMockOAuth>>;
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

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

const uploaded = (name = 'a.png') => `http://localhost:0/uploads/${name}`;

before(async () => {
  const uploadDir = await mkdtemp(join(tmpdir(), 'ieum-test-'));
  mock = await startMockOAuth();
  const config: Config = {
    port: 0, jwtSecret: 'test-secret-test-secret-test-secret', corsOrigins: ['http://localhost'],
    publicBaseUrl: 'http://localhost:0', uploadDir, rateLimit: false,
    webUrl: 'https://web.example', socialMockUrl: mock.url,
    social: {
      kakao: { clientId: 'k', clientSecret: 's' },
      naver: { clientId: 'n', clientSecret: 's' },
      google: { clientId: 'g', clientSecret: 's' },
    },
  };
  db = await createDb({});
  await migrate(db);
  app = await buildApp(config, db);
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
  const ok = await send(PNG);
  assert.equal(ok.statusCode, 201);
  assert.match(JSON.parse(ok.body).url, /\/uploads\/[\w-]+\.png$/);
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
  assert.equal(res.statusCode, 302);
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
