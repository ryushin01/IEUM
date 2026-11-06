import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { PostForm } from './PostForm';

const upload = vi.hoisted(() => vi.fn());
vi.mock('@/shared/api', async (original) => ({ ...await original<object>(), pickAndUploadImages: upload }));

afterEach(() => {
  vi.unstubAllGlobals();
  upload.mockReset();
});

const publish = () => screen.getByRole('button', { name: '게시하기' });
const pick = async () => {
  await userEvent.click(screen.getByRole('button', { name: /앨범에서 선택/ }));
  await screen.findByLabelText('1번째 사진 설명');
};

it('사진을 고르기 전에는 게시할 수 없다', () => {
  stubApi({});
  render(<TestProviders><PostForm /></TestProviders>);
  expect(publish()).toBeDisabled();
  expect(screen.getByText('사진 0 / 5장')).toBeInTheDocument();
});

it('내용이 없으면 안내하고 보내지 않는다', async () => {
  upload.mockResolvedValue(['/a.png']);
  const calls = stubApi({});
  render(<TestProviders><PostForm /></TestProviders>);
  await pick();
  await userEvent.click(publish());
  expect(await screen.findByText('내용을 입력해 주세요.')).toBeInTheDocument();
  expect(calls).toEqual([]);
});

it('사진 설명과 내용을 보내고, 사진을 지울 수 있다', async () => {
  upload.mockResolvedValue(['/a.png', '/b.png']);
  const calls = stubApi({ 'POST /posts': {} });
  render(<TestProviders><PostForm /></TestProviders>);
  await pick();
  await userEvent.click(screen.getByRole('button', { name: '2번째 사진 삭제' }));
  await userEvent.type(screen.getByLabelText('1번째 사진 설명'), '노을');
  await userEvent.type(screen.getByLabelText('내용'), '오늘의 기록');
  await userEvent.click(publish());
  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]?.body).toEqual({ caption: '오늘의 기록', images: [{ url: '/a.png', alt: '노을' }] });
});

it('게시에 실패하면 안내하고 입력을 유지한다', async () => {
  upload.mockResolvedValue(['/a.png']);
  stubApi({ 'POST /posts': () => apiError(400, '금칙어가 있습니다.') });
  render(<TestProviders><PostForm /></TestProviders>);
  await pick();
  await userEvent.type(screen.getByLabelText('내용'), '기록');
  await userEvent.click(publish());
  expect(await screen.findByRole('alert')).toHaveTextContent('금칙어가 있습니다.');
  expect(screen.getByLabelText('내용')).toHaveValue('기록');
});
