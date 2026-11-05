import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

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
