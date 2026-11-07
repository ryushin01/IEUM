import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { App } from 'antd';
import { afterEach, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { CONVERSATIONS_KEY } from '@/entities/conversation';
import { AppShell } from './AppShell';

afterEach(() => vi.unstubAllGlobals());

const show = (path: string, unread = 0) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(CONVERSATIONS_KEY, [{ id: 'c1', unreadCount: unread }]);
  render(
    <App>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}><AppShell /></MemoryRouter>
      </QueryClientProvider>
    </App>,
  );
};

it('본문 바로가기와 현재 메뉴를 제공한다', () => {
  show('/');
  expect(screen.getByRole('link', { name: '본문 바로가기' })).toHaveAttribute('href', '#main');
  expect(screen.getByRole('link', { name: '홈' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getByRole('link', { name: '내 정보' })).not.toHaveAttribute('aria-current');
});

it('첫 화면에서는 글쓰기를 보여 주고 뒤로 가기는 숨긴다', () => {
  show('/me');
  expect(screen.getByRole('link', { name: '글쓰기' })).toHaveAttribute('href', '/posts/new');
  expect(screen.queryByRole('button', { name: '뒤로 가기' })).toBeNull();
});

it('하위 화면에서는 뒤로 가기를 보여 주고 글쓰기는 숨긴다', () => {
  show('/settings');
  expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: '글쓰기' })).toBeNull();
});

it('안 읽은 메시지 수를 표시하고 낭독한다', () => {
  show('/', 120);
  expect(screen.getByText('99+')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /메시지, 읽지 않은 메시지 120개/ })).toBeInTheDocument();
});

it('대화방에서는 하단 메뉴를 숨긴다', () => {
  show('/dm/c1');
  expect(screen.queryByRole('navigation', { name: '주 메뉴' })).toBeNull();
});
