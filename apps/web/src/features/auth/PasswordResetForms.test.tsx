import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { ForgotPasswordForm, ResetPasswordForm } from './PasswordResetForms';

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, '', '/');
});

it('메일 요청 후 가입 여부와 상관없이 같은 안내를 보여 준다', async () => {
  const calls = stubApi({ 'POST /auth/password-reset/request': {} });
  render(<TestProviders><ForgotPasswordForm /></TestProviders>);
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
  await userEvent.click(screen.getByRole('button', { name: '재설정 메일 받기' }));
  expect(await screen.findByRole('status')).toHaveTextContent('가입된 이메일이라면');
  expect(calls[0]?.body).toEqual({ email: 'a@example.com' });
  expect(screen.queryByRole('link')).toBeNull();
});

it('데모 응답이면 재설정 화면 링크를 함께 보여 준다', async () => {
  stubApi({ 'POST /auth/password-reset/request': { demoLink: '/reset-password#token=x' } });
  render(<TestProviders><ForgotPasswordForm /></TestProviders>);
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'a@example.com' } });
  await userEvent.click(screen.getByRole('button', { name: '재설정 메일 받기' }));
  expect(await screen.findByRole('link', { name: /재설정 화면/ })).toHaveAttribute('href', '/reset-password#token=x');
});

it('토큰이 없으면 안내하고 다시 요청하게 한다', () => {
  render(<TestProviders><ResetPasswordForm /></TestProviders>);
  expect(screen.getByRole('alert')).toHaveTextContent('링크가 올바르지 않습니다');
  expect(screen.getByRole('link', { name: '재설정 메일 다시 받기' })).toBeInTheDocument();
});

it('토큰은 읽은 뒤 주소에서 지우고, 확인 값이 다르면 보내지 않는다', async () => {
  window.history.replaceState(null, '', '/reset-password#token=secret');
  const calls = stubApi({ 'POST /auth/password-reset/confirm': {} });
  render(<TestProviders><ResetPasswordForm /></TestProviders>);
  expect(window.location.hash).toBe('');
  fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'Passw0rd!' } });
  fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'different' } });
  await userEvent.click(screen.getByRole('button', { name: '비밀번호 변경' }));
  expect(await screen.findByText('같은 비밀번호를 입력해 주세요.')).toBeInTheDocument();
  expect(calls).toEqual([]);
});

it('성공하면 토큰과 새 비밀번호를 보내고, 실패하면 다시 요청하게 한다', async () => {
  window.history.replaceState(null, '', '/reset-password#token=secret');
  let response: unknown = apiError(400, '링크가 만료되었습니다.');
  const calls = stubApi({ 'POST /auth/password-reset/confirm': () => response });
  render(<TestProviders><ResetPasswordForm /></TestProviders>);
  fireEvent.change(screen.getByLabelText('새 비밀번호'), { target: { value: 'Passw0rd!' } });
  fireEvent.change(screen.getByLabelText('새 비밀번호 확인'), { target: { value: 'Passw0rd!' } });
  const submit = screen.getByRole('button', { name: '비밀번호 변경' });
  await userEvent.click(submit);
  expect(await screen.findByRole('alert')).toHaveTextContent('링크가 만료되었습니다.');
  response = {};
  await userEvent.click(submit);
  expect(await screen.findByRole('status')).toHaveTextContent('비밀번호를 변경했습니다');
  await waitFor(() => expect(calls.at(-1)?.body).toEqual({ token: 'secret', password: 'Passw0rd!' }));
});
