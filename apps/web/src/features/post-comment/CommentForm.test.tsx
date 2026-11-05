import { QueryClient } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { commentsKey } from '@/entities/post';
import { jsonResponse, TestProviders } from '@/shared/lib/test-providers';
import { CommentForm } from './CommentForm';

const comment = { id: 'c1', postId: 'p1', author: { id: 'u', nickname: '나', avatarUrl: null }, body: '좋아요', createdAt: '2026-11-05T00:00:00Z' };

it('아직 받지 않은 댓글 목록을 새 댓글 하나로 채우지 않는다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(201, comment)));
  const client = new QueryClient();
  render(<TestProviders client={client}><CommentForm postId="p1" /></TestProviders>);
  const input = screen.getByRole('textbox', { name: '댓글' });
  await userEvent.type(input, '좋아요{Enter}');
  await waitFor(() => expect(input).toHaveValue(''));
  expect(client.getQueryData(commentsKey('p1'))).toBeUndefined();
});

it('받아 둔 목록에는 새 댓글을 더한다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(201, comment)));
  const client = new QueryClient();
  client.setQueryData(commentsKey('p1'), []);
  render(<TestProviders client={client}><CommentForm postId="p1" /></TestProviders>);
  await userEvent.type(screen.getByRole('textbox', { name: '댓글' }), '좋아요{Enter}');
  await waitFor(() => expect(client.getQueryData(commentsKey('p1'))).toEqual([comment]));
});
