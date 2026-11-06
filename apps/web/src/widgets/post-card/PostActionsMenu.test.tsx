import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { ME_KEY } from '@/entities/session';
import { stubApi, TestProviders } from '@/shared/lib/test-providers';
import { PostActionsMenu } from './PostActionsMenu';

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

const show = (value = post) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(ME_KEY, { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false });
  render(<TestProviders client={client}><PostActionsMenu post={value} /></TestProviders>);
  return userEvent.click(screen.getByRole('button', { name: '게시글 메뉴' }));
};
const mine = { ...post, author: { ...post.author, id: 'me' } };

it('내 글에는 수정과 삭제만 보여 준다', async () => {
  await show(mine);
  expect(await screen.findByRole('menuitem', { name: '수정하기' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: '삭제하기' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: '신고하기' })).toBeNull();
});

it('남의 글에는 신고와 차단만 보여 준다', async () => {
  await show();
  expect(await screen.findByRole('menuitem', { name: '신고하기' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: '하늘빛 님 차단' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: '삭제하기' })).toBeNull();
});

it('신고하기는 신고 창을 연다', async () => {
  stubApi({});
  await show();
  await userEvent.click(await screen.findByRole('menuitem', { name: '신고하기' }));
  expect(await screen.findByRole('dialog', { name: '신고하기' })).toBeInTheDocument();
});

it('삭제와 차단은 확인을 거친 뒤 요청한다', async () => {
  const calls = stubApi({ 'DELETE /posts/p1': {} });
  await show(mine);
  await userEvent.click(await screen.findByRole('menuitem', { name: '삭제하기' }));
  await screen.findByRole('dialog');
  expect(calls).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: /^삭\s*제$/ }));
  await waitFor(() => expect(calls[0]?.key).toBe('DELETE /posts/p1'));
});
