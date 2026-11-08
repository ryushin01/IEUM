import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { API_URL } from '@/shared/config';
import { handlers } from './handlers';
import { resetDemo } from './server';

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterAll(() => server.close());
beforeEach(() => {
  localStorage.clear();
  resetDemo();
});

const send = (path: string, init?: RequestInit) => fetch(`${API_URL}${path}`, init);
const login = async () => {
  const res = await send('/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'demo@ieum.app', password: 'ieum-demo-1234' }),
  });
  return ((await res.json()) as { accessToken: string }).accessToken;
};

describe('MSW 핸들러', () => {
  it('실제 fetch로 로그인하고, 토큰과 쿼리 문자열을 목업 API로 넘긴다', async () => {
    const token = await login();
    const res = await send('/posts?limit=1', { headers: { authorization: `Bearer ${token}` } });
    expect(res.status).toBe(200);
  });

  it('인증 없는 요청에는 목업 API의 401을 그대로 돌려준다', async () => {
    expect((await send('/posts')).status).toBe(401);
  });

});
