import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { ProfileForm } from './ProfileForm';

const upload = vi.hoisted(() => vi.fn());
vi.mock('@/shared/api', async (original) => ({ ...await original<object>(), pickAndUploadImages: upload }));

const me = { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false };
const save = () => screen.getByRole('button', { name: /저\s*장/ });

afterEach(() => {
  vi.unstubAllGlobals();
  upload.mockReset();
});

it('기존 값을 채우고 고친 값을 보낸다', async () => {
  const calls = stubApi({ 'PATCH /me': { ...me, nickname: '새이름' } });
  render(<TestProviders><ProfileForm me={me} /></TestProviders>);
  expect(screen.getByLabelText('소개')).toHaveValue('소개');
  fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: '새이름' } });
  await userEvent.click(save());
  await waitFor(() => expect(calls[0]).toEqual({ key: 'PATCH /me', body: { nickname: '새이름', bio: '소개', avatarUrl: null, interests: ['trip'] } }));
});

it('닉네임 형식이 틀리면 보내지 않는다', async () => {
  const calls = stubApi({});
  render(<TestProviders><ProfileForm me={me} /></TestProviders>);
  fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: 'a' } });
  await userEvent.click(save());
  expect(await screen.findByText(/2~20자의 글자/)).toBeInTheDocument();
  expect(calls).toEqual([]);
});

it('사진을 바꾸고 지울 수 있다', async () => {
  upload.mockResolvedValue(['/new.png']);
  const calls = stubApi({ 'PATCH /me': me });
  render(<TestProviders><ProfileForm me={me} /></TestProviders>);
  expect(screen.queryByRole('button', { name: /사진 삭제/ })).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: /사진 변경/ }));
  expect(await screen.findByRole('img', { name: '이음데모 님의 프로필 사진' })).toHaveAttribute('src', '/new.png');
  await userEvent.click(screen.getByRole('button', { name: /사진 삭제/ }));
  await userEvent.click(save());
  await waitFor(() => expect(calls[0]?.body).toMatchObject({ avatarUrl: null }));
});

it('실패하면 안내한다', async () => {
  stubApi({ 'PATCH /me': () => apiError(409, '이미 사용 중인 닉네임입니다.') });
  render(<TestProviders><ProfileForm me={me} /></TestProviders>);
  await userEvent.click(save());
  expect(await screen.findByRole('alert')).toHaveTextContent('이미 사용 중인 닉네임입니다.');
});
