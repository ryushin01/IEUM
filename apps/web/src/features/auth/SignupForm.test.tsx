import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { clearSession } from '@/shared/api';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { SignupForm } from './SignupForm';

afterEach(async () => {
  vi.unstubAllGlobals();
  await clearSession();
});

const change = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label, { exact: typeof label !== 'string' ? undefined : true }), { target: { value } });

const fillValid = async () => {
  change('이메일', 'a@example.com');
  change('닉네임', '새싹');
  change('비밀번호', 'Passw0rd!');
  change('비밀번호 확인', 'Passw0rd!');
  await userEvent.click(screen.getByRole('checkbox', { name: '만 14세 이상입니다.' }));
  await userEvent.click(screen.getByRole('checkbox', { name: /이용약관과/ }));
};
const submit = () => userEvent.click(screen.getByRole('button', { name: '회원 가입' }));

it('형식이 틀리면 칸마다 안내하고 요청하지 않는다', async () => {
  const calls = stubApi({});
  render(<TestProviders><SignupForm /></TestProviders>);
  change('이메일', 'nope');
  change('비밀번호', 'short');
  change('비밀번호 확인', 'other');
  await submit();
  expect(await screen.findByText('이메일 형식을 확인해 주세요.')).toBeInTheDocument();
  expect(await screen.findByText('영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.')).toBeInTheDocument();
  expect(await screen.findByText('같은 비밀번호를 입력해 주세요.')).toBeInTheDocument();
  // 브라우저 기본 검증이 제출을 막으면 아래 칸들의 안내가 나오지 않습니다.
  expect(await screen.findByText('닉네임 형식을 확인해 주세요.')).toBeInTheDocument();
  expect(await screen.findByText('약관과 개인정보 처리방침에 동의해 주세요.')).toBeInTheDocument();
  expect(calls).toEqual([]);
});

it('성공하면 확인용 비밀번호는 보내지 않고 완료 화면을 보여 준다', async () => {
  const calls = stubApi({ 'POST /auth/signup': { user: { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false }, accessToken: 'a', refreshToken: 'r' } });
  render(<TestProviders><SignupForm /></TestProviders>);
  await fillValid();
  await submit();
  expect(await screen.findByRole('status')).toHaveTextContent('회원 가입이 완료되었습니다.');
  expect(calls[0]?.body).toEqual({ email: 'a@example.com', password: 'Passw0rd!', nickname: '새싹', agreeTerms: true, confirmAge: true, interests: [] });
});

it('실패하면 안내하고 입력값을 유지한다', async () => {
  stubApi({ 'POST /auth/signup': () => apiError(409, '이미 가입된 이메일입니다.') });
  render(<TestProviders><SignupForm /></TestProviders>);
  await fillValid();
  await submit();
  expect(await screen.findByRole('alert')).toHaveTextContent('이미 가입된 이메일입니다.');
  expect(screen.getByLabelText('이메일')).toHaveValue('a@example.com');
});
