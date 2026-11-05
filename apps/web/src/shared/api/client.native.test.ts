import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { hasSession, onSessionExpired, request, restoreSession } from './client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const calls: { method: string; params: unknown }[] = [];
let refreshReply: unknown;

beforeEach(async () => {
  calls.length = 0;
  window.IeumBridge = {
    postMessage(raw) {
      const { id, method, params } = JSON.parse(raw) as { id: number; method: string; params: unknown };
      calls.push({ method, params });
      let result: unknown = null;
      if (method === 'auth.getTokens') result = { accessToken: 'old', refreshToken: 'r1' };
      if (method === 'auth.refresh') result = refreshReply;
      setTimeout(() => window.__ieumBridgeReceive!({ id, ok: true, result }), 0);
    },
  };
  await restoreSession();
});

afterEach(() => {
  delete window.IeumBridge;
});

it('앱에서는 웹이 직접 재발급하지 않고 앱에 맡긴다', async () => {
  refreshReply = { accessToken: 'new', refreshToken: 'r2' };
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
    expect(url.endsWith('/auth/refresh')).toBe(false);
    return (init.headers as Record<string, string>).authorization === 'Bearer new' ? json(200, { ok: true }) : json(401, {});
  });
  vi.stubGlobal('fetch', fetchMock);
  await expect(request('/a')).resolves.toEqual({ ok: true });
  expect(calls.find((c) => c.method === 'auth.refresh')?.params).toEqual({ staleAccessToken: 'old' });
});

it('앱이 세션 만료를 알리면 로그아웃 처리한다', async () => {
  refreshReply = null;
  vi.stubGlobal('fetch', vi.fn(async () => json(401, { code: 'unauthorized', message: '만료' })));
  const expired = vi.fn();
  onSessionExpired(expired);
  await expect(request('/a')).rejects.toMatchObject({ status: 401 });
  expect(expired).toHaveBeenCalledOnce();
  expect(hasSession()).toBe(false);
});
