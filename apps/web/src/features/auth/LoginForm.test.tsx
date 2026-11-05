import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import { clearSession, hasSession } from '@/shared/api';
import { jsonResponse, TestProviders } from '@/shared/lib/test-providers';
import { LoginForm } from './LoginForm';

beforeEach(async () => {
  localStorage.clear();
  await clearSession();
});

const fill = async () => {
  await userEvent.type(screen.getByLabelText('이메일'), 'a@example.com');
  await userEvent.type(screen.getByLabelText('비밀번호'), 'pw');
  await userEvent.click(screen.getByRole('button', { name: '로그인' }));
};

it('비어 있으면 요청하지 않고 안내한다', async () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  render(<TestProviders><LoginForm /></TestProviders>);
  await userEvent.click(screen.getByRole('button', { name: '로그인' }));
  expect(await screen.findByText('이메일을 입력해 주세요.')).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

it('성공하면 세션을 저장한다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { user: { id: 'u' }, accessToken: 'a', refreshToken: 'r' })));
  render(<TestProviders><LoginForm /></TestProviders>);
  await fill();
  await waitFor(() => expect(hasSession()).toBe(true));
});

it('실패하면 서버 안내를 보여 주고 입력을 유지한다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { code: 'invalid_credentials', message: '이메일 또는 비밀번호가 올바르지 않습니다.' })));
  render(<TestProviders><LoginForm /></TestProviders>);
  await fill();
  expect(await screen.findByRole('alert')).toHaveTextContent('올바르지 않습니다');
  expect(screen.getByLabelText('이메일')).toHaveValue('a@example.com');
  expect(hasSession()).toBe(false);
});
