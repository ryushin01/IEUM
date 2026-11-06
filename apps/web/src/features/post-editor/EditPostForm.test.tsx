import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { EditPostForm } from './EditPostForm';

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

it('기존 내용을 채우고, 고친 내용을 보낸다', async () => {
  const calls = stubApi({ 'PATCH /posts/p1': { ...post, caption: '고친 글' } });
  render(<TestProviders><EditPostForm post={post} /></TestProviders>);
  const caption = screen.getByLabelText('내용');
  expect(caption).toHaveValue('퇴근길 하늘');
  fireEvent.change(caption, { target: { value: '고친 글' } });
  await userEvent.click(screen.getByRole('button', { name: /저\s*장/ }));
  await waitFor(() => expect(calls).toEqual([{ key: 'PATCH /posts/p1', body: { caption: '고친 글' } }]));
});

it('내용을 비우면 보내지 않는다', async () => {
  const calls = stubApi({});
  render(<TestProviders><EditPostForm post={post} /></TestProviders>);
  fireEvent.change(screen.getByLabelText('내용'), { target: { value: '   ' } });
  await userEvent.click(screen.getByRole('button', { name: /저\s*장/ }));
  expect(await screen.findByText('내용을 입력해 주세요.')).toBeInTheDocument();
  expect(calls).toEqual([]);
});

it('실패하면 안내한다', async () => {
  stubApi({ 'PATCH /posts/p1': () => apiError(403, '수정할 수 없습니다.') });
  render(<TestProviders><EditPostForm post={post} /></TestProviders>);
  await userEvent.click(screen.getByRole('button', { name: /저\s*장/ }));
  expect(await screen.findByRole('alert')).toHaveTextContent('수정할 수 없습니다.');
});
