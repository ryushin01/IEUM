import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

/** 테스트 전용입니다. 앱 코드에서 가져오지 않습니다. */
export function TestProviders({ children, client }: { children: ReactNode; client?: QueryClient }) {
  return (
    <App>
      <QueryClientProvider client={client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </App>
  );
}

export const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

type Route = unknown | ((body: unknown) => unknown);

/** `'POST /posts'` 형태로 응답을 정해 fetch를 대신합니다. 정하지 않은 요청은 404입니다. 함수가 Response를 돌려주면 그대로 씁니다. */
export function stubApi(routes: Record<string, Route>) {
  const calls: { key: string; body: unknown }[] = [];
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${new URL(String(input), 'http://localhost').pathname}`;
    const body: unknown = typeof init?.body === 'string' ? JSON.parse(init.body) : undefined;
    calls.push({ key, body });
    if (!(key in routes)) return jsonResponse(404, { code: 'not_found', message: `${key} 없음` });
    const route = routes[key];
    const result: unknown = typeof route === 'function' ? (route as (b: unknown) => unknown)(body) : route;
    return result instanceof Response ? result : jsonResponse(200, result ?? {});
  }));
  return calls;
}

export const apiError = (status: number, message: string) => jsonResponse(status, { code: 'error', message });
