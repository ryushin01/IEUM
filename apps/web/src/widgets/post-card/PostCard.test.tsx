import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ME_KEY } from '@/entities/session';
import { TestProviders } from '@/shared/lib/test-providers';
import { PostCard } from './PostCard';

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

const show = (list: boolean) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(ME_KEY, { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false });
  render(<TestProviders client={client}><PostCard post={post} list={list} /></TestProviders>);
};

it('목록에서는 상세로 가는 링크와 댓글 입력칸을 보여 준다', () => {
  show(true);
  const link = screen.getByRole('link', { name: '댓글 보기: 하늘빛 님의 글, 퇴근길 하늘' });
  expect(link).toHaveAttribute('href', '/posts/p1');
  expect(screen.getByRole('textbox', { name: '댓글' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /좋아요/ })).toBeInTheDocument();
});

it('상세에서는 댓글 영역을 따로 두므로 링크와 입력칸이 없다', () => {
  show(false);
  expect(screen.queryByRole('link', { name: /댓글 보기/ })).toBeNull();
  expect(screen.queryByRole('textbox', { name: '댓글' })).toBeNull();
  expect(screen.getByRole('button', { name: /좋아요/ })).toBeInTheDocument();
});

it('긴 내용은 링크 이름에서 줄인다', () => {
  const client = new QueryClient();
  render(<TestProviders client={client}><PostCard post={{ ...post, caption: '가'.repeat(50) }} list /></TestProviders>);
  expect(screen.getByRole('link', { name: `댓글 보기: 하늘빛 님의 글, ${'가'.repeat(30)}` })).toBeInTheDocument();
});
