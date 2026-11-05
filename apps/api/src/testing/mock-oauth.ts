import { createServer, type Server } from 'node:http';

/** 키 없이 소셜 로그인 흐름을 검사하는 가짜 제공자입니다. 실제 제공자와의 연동을 보장하지는 않습니다. */
const PROFILES: Record<string, unknown> = {
  kakao: { id: 1001, kakao_account: { profile: { nickname: '카카오 사용자' } } },
  naver: { response: { id: 'naver-1', nickname: '네이버사용자', email: 'unverified@example.com' } },
  // 이미 가입된 이메일과 겹치는 계정입니다.
  google: { sub: 'google-1', name: 'Google User', email: process.env.MOCK_GOOGLE_EMAIL ?? 'demo@ieum.app', email_verified: true },
};

export function startMockOAuth(port = 0): Promise<{ url: string; server: Server }> {
  const server = createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    const [, provider, kind] = url.pathname.split('/');
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
      resolve({ url: `http://127.0.0.1:${address.port}`, server });
    });
  });
}

if (process.argv[1]?.endsWith('mock-oauth.ts')) await startMockOAuth(Number(process.env.PORT ?? 4200));
