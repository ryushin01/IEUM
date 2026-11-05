import { QueryClient, useQuery } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { postKey, type Post } from '@/entities/post';
import { jsonResponse, TestProviders } from '@/shared/lib/test-providers';
import { LikeButton } from './LikeButton';

const post: Post = {
  id: 'p1', author: { id: 'u1', nickname: '하늘빛', avatarUrl: null, isOfficial: false }, isHot: false, caption: '내용',
  images: [], likeCount: 3, commentCount: 0, liked: false, createdAt: '2026-11-05T00:00:00Z', edited: false,
};

function Harness() {
  const { data } = useQuery<Post>({ queryKey: postKey('p1'), enabled: false });
  return data ? <LikeButton post={data} /> : null;
}

const setup = () => {
  const client = new QueryClient();
  client.setQueryData(postKey('p1'), post);
  render(<TestProviders client={client}><Harness /></TestProviders>);
  return screen.getByRole('button');
};

it('누르는 즉시 반영하고 서버 응답으로 맞춘다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { ...post, liked: true, likeCount: 10 })));
  const button = setup();
  await userEvent.click(button);
  expect(button).toHaveAttribute('aria-pressed', 'true');
  await waitFor(() => expect(button).toHaveTextContent('10'));
});

it('실패하면 되돌린다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(500, { code: 'internal', message: '오류' })));
  const button = setup();
  await userEvent.click(button);
  await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'false'));
  expect(button).toHaveTextContent('3');
});
