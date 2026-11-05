import { createServer, type IncomingMessage, type Server } from 'node:http';

/** 키 없이 소셜 로그인 흐름을 검사하는 가짜 제공자입니다. 실제 제공자와의 연동을 보장하지는 않습니다. */
const PROFILES: Record<string, unknown> = {
  kakao: { id: 1001, kakao_account: { profile: { nickname: '카카오 사용자' } } },
  naver: { response: { id: 'naver-1', nickname: '네이버사용자', email: 'unverified@example.com' } },
  // 이미 가입된 이메일과 겹치는 계정입니다.
  google: { sub: 'google-1', name: 'Google User', email: process.env.MOCK_GOOGLE_EMAIL ?? 'demo@ieum.app', email_verified: true },
};

/** 서명은 검사하지 않으므로 형식만 맞춥니다. */
function appleIdToken(clientId: string): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return [
    encode({ alg: 'none' }),
    encode({
      iss: 'https://appleid.apple.com', aud: clientId, sub: 'apple-1', exp: Math.floor(Date.now() / 1000) + 600,
      email: 'relay123@privaterelay.appleid.com', email_verified: 'true', is_private_email: 'true',
    }),
    'x',
  ].join('.');
}

const readBody = (req: IncomingMessage) =>
  new Promise<URLSearchParams>((resolve) => {
    let raw = '';
    req.on('data', (chunk) => (raw += chunk));
    req.on('end', () => resolve(new URLSearchParams(raw)));
  });

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

export function startMockOAuth(port = 0): Promise<{ url: string; server: Server; revoked: string[] }> {
  const revoked: string[] = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    const [, provider, kind] = url.pathname.split('/');
    if (provider === 'apple' && kind === 'authorize') {
      // 실제 Apple처럼 콜백을 폼 POST로 보냅니다.
      const fields = {
        code: 'code-apple',
        state: url.searchParams.get('state')!,
        user: JSON.stringify({ name: { firstName: '사과', lastName: '김' } }),
      };
      const inputs = Object.entries(fields)
        .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`)
        .join('');
      res.setHeader('content-type', 'text/html; charset=utf-8');
      res.end(`<!doctype html><form method="post" action="${url.searchParams.get('redirect_uri')}">${inputs}</form><script>document.forms[0].submit()</script>`);
      return;
    }
    if (provider === 'apple' && kind === 'token') {
      const body = await readBody(req);
      res.setHeader('content-type', 'application/json');
      // 실제 Apple처럼 ES256 JWT인 client_secret이 없으면 거부합니다.
      const header = JSON.parse(Buffer.from((body.get('client_secret') ?? '').split('.')[0] ?? '', 'base64url').toString() || '{}');
      if (header.alg !== 'ES256' || !header.kid) {
        res.writeHead(400).end('{"error":"invalid_client"}');
        return;
      }
      res.end(JSON.stringify({ access_token: 'apple-access', refresh_token: 'apple-refresh-token', id_token: appleIdToken(body.get('client_id')!) }));
      return;
    }
    if (provider === 'apple' && kind === 'revoke') {
      revoked.push((await readBody(req)).get('token') ?? '');
      res.end();
      return;
    }
    if (kind === 'authorize') {
      const target = new URL(url.searchParams.get('redirect_uri')!);
      target.searchParams.set('code', `code-${provider}`);
      target.searchParams.set('state', url.searchParams.get('state')!);
      res.writeHead(302, { location: target.toString() }).end();
      return;
    }
    res.setHeader('content-type', 'application/json');
    if (kind === 'token') {
      res.end(JSON.stringify({ access_token: `token-${provider}` }));
      return;
    }
    if (req.headers.authorization !== `Bearer token-${provider}`) {
      res.writeHead(401).end('{}');
      return;
    }
    res.end(JSON.stringify(PROFILES[provider!]));
  });
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const address = server.address() as { port: number };
      resolve({ url: `http://127.0.0.1:${address.port}`, server, revoked });
    });
  });
}

if (process.argv[1]?.endsWith('mock-oauth.ts')) await startMockOAuth(Number(process.env.PORT ?? 4200));
