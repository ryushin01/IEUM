import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, jsonResponse, TestProviders } from '@/shared/lib/test-providers';
import { PostFeed } from './PostFeed';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0b6be0"/></svg>')}`;

const post = {
  id: 'p1',
  author: { id: 'u1', nickname: '하늘빛', avatarUrl: null, isOfficial: false },
  isHot: false,
  caption: '퇴근길 하늘',
  images: [{ url: IMAGE, alt: '노을 그림' }],
  likeCount: 3,
  commentCount: 2,
  liked: false,
  createdAt: '2026-11-01T00:00:00Z',
  edited: false,
};
afterEach(() => vi.unstubAllGlobals());

/** 커서별 응답을 돌려줍니다. /me 같은 다른 요청은 404입니다. */
const stubFeed = (pages: Record<string, unknown>) => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost');
    if (url.pathname !== '/posts') return jsonResponse(404, { code: 'not_found', message: '없음' });
    const page = pages[url.searchParams.get('cursor') ?? ''];
    return page instanceof Response ? page : jsonResponse(200, page);
  });
  vi.stubGlobal('fetch', fetchMock);
};

it('글이 없으면 첫 글 작성으로 안내한다', async () => {
  stubFeed({ '': { items: [], nextCursor: null } });
  render(<TestProviders><PostFeed /></TestProviders>);
  expect(await screen.findByRole('link', { name: '첫 게시글 올리기' })).toHaveAttribute('href', '/posts/new');
});

it('실패하면 안내하고 다시 시도할 수 있다', async () => {
  const pages: Record<string, unknown> = { '': apiError(500, '불러오지 못했습니다.') };
  stubFeed(pages);
  render(<TestProviders><PostFeed /></TestProviders>);
  expect(await screen.findByText('불러오지 못했습니다.')).toBeInTheDocument();
  pages[''] = { items: [post], nextCursor: null };
  await userEvent.click(screen.getByRole('button', { name: /다시 시도/ }));
  expect(await screen.findByRole('article')).toBeInTheDocument();
});

it('관찰을 쓸 수 없어도 더 보기 버튼으로 이어 볼 수 있고, 끝나면 버튼이 사라진다', async () => {
  stubFeed({
    '': { items: [post], nextCursor: 'c1' },
    c1: { items: [{ ...post, id: 'p2', caption: '두 번째' }], nextCursor: null },
  });
  render(<TestProviders><PostFeed /></TestProviders>);
  await userEvent.click(await screen.findByRole('button', { name: /더 보기/ }));
  await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(2));
  expect(screen.queryByRole('button', { name: /더 보기/ })).toBeNull();
});
