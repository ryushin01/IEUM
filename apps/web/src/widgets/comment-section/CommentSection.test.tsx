import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { ME_KEY } from '@/entities/session';
import { stubApi, TestProviders } from '@/shared/lib/test-providers';
import { CommentSection } from './CommentSection';

const comment = { id: 'c1', postId: 'p1', author: { id: 'u2', nickname: '소라_기록', avatarUrl: null }, body: '색이 곱네요', createdAt: new Date().toISOString() };
afterEach(() => vi.unstubAllGlobals());

const show = (postAuthorId: string) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(ME_KEY, { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false });
  render(<TestProviders client={client}><CommentSection postId="p1" postAuthorId={postAuthorId} /></TestProviders>);
};

it('댓글이 없으면 안내하고 입력칸을 보여 준다', async () => {
  stubApi({ 'GET /posts/p1/comments': [], 'GET /me': {} });
  show('u2');
  expect(await screen.findByText('첫 댓글을 남겨 보세요.')).toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: '댓글' })).toBeInTheDocument();
});

it('개수와 작성자 프로필 링크를 보여 준다', async () => {
  stubApi({ 'GET /posts/p1/comments': [comment], 'GET /me': { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false } });
  show('u2');
  expect(await screen.findByRole('heading', { name: '댓글 1' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: '소라_기록' })).toHaveAttribute('href', '/users/u2');
  expect(screen.getByText('색이 곱네요')).toBeInTheDocument();
});

it('남의 글에 달린 남의 댓글은 신고만 할 수 있다', async () => {
  stubApi({ 'GET /posts/p1/comments': [comment], 'GET /me': { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false } });
  show('u2');
  await userEvent.click(await screen.findByRole('button', { name: '소라_기록 님의 댓글 메뉴' }));
  expect(await screen.findByRole('menuitem', { name: '신고하기' })).toBeInTheDocument();
  expect(screen.queryByRole('menuitem', { name: '삭제하기' })).toBeNull();
});

it('내 글이면 남의 댓글을 삭제할 수 있다', async () => {
  const calls = stubApi({ 'GET /posts/p1/comments': [comment], 'GET /me': { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false }, 'DELETE /posts/p1/comments/c1': {}, 'DELETE /comments/c1': {} });
  show('me');
  await userEvent.click(await screen.findByRole('button', { name: '소라_기록 님의 댓글 메뉴' }));
  await userEvent.click(await screen.findByRole('menuitem', { name: '삭제하기' }));
  await waitFor(() => expect(calls.some((call) => call.key.startsWith('DELETE'))).toBe(true));
});
