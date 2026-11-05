import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSession, hasSession, onSessionExpired, request, setSession } from './client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

beforeEach(async () => {
  localStorage.clear();
  await clearSession();
});

describe('request', () => {
  it('401이면 한 번만 재발급하고 동시 요청을 모두 재시도한다', async () => {
    await setSession({ accessToken: 'old', refreshToken: 'r1' });
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith('/auth/refresh')) return json(200, { accessToken: 'new', refreshToken: 'r2' });
      const auth = (init.headers as Record<string, string>).authorization;
      return auth === 'Bearer new' ? json(200, { ok: true }) : json(401, { code: 'unauthorized' });
    });
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([request('/a'), request('/b')]);

    const refreshCalls = fetchMock.mock.calls.filter(([url]) => url.endsWith('/auth/refresh'));
    expect(refreshCalls).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('ieum.tokens')!).refreshToken).toBe('r2');
  });

  it('재발급이 401이면 세션을 지우고 알린다', async () => {
    await setSession({ accessToken: 'old', refreshToken: 'r1' });
    vi.stubGlobal('fetch', vi.fn(async () => json(401, { code: 'unauthorized', message: '만료' })));
    const expired = vi.fn();
    onSessionExpired(expired);
    await expect(request('/a')).rejects.toMatchObject({ status: 401 });
    expect(expired).toHaveBeenCalledOnce();
    expect(hasSession()).toBe(false);
  });

  it('재발급이 서버 오류면 로그아웃시키지 않는다', async () => {
    await setSession({ accessToken: 'old', refreshToken: 'r1' });
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      url.endsWith('/auth/refresh') ? json(500, { code: 'internal', message: '오류' }) : json(401, {})));
    await expect(request('/a')).rejects.toMatchObject({ status: 500 });
    expect(hasSession()).toBe(true);
  });

  it('네트워크 오류를 안내 문구로 바꾼다', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('failed'); }));
    await expect(request('/a')).rejects.toMatchObject({ code: 'network', message: '네트워크 연결을 확인해 주세요.' });
  });
});
