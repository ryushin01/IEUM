import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { clearSession } from '@/shared/api';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { SocialSignupForm } from './SocialSignupForm';

const state = { signupToken: 'token', provider: 'kakao' as const, nickname: '카카오닉' };

afterEach(async () => {
  vi.unstubAllGlobals();
  await clearSession();
});

const agree = async () => {
  await userEvent.click(screen.getByRole('checkbox', { name: '만 14세 이상입니다.' }));
  await userEvent.click(screen.getByRole('checkbox', { name: /이용약관과/ }));
  await userEvent.click(screen.getByRole('button', { name: '가입 완료' }));
};

it('제공자의 닉네임을 채우고, 동의 없이는 보내지 않는다', async () => {
  const calls = stubApi({});
  render(<TestProviders><SocialSignupForm state={state} /></TestProviders>);
  expect(screen.getByLabelText('닉네임')).toHaveValue('카카오닉');
  await userEvent.click(screen.getByRole('button', { name: '가입 완료' }));
  expect(await screen.findByText('만 14세 이상만 가입할 수 있습니다.')).toBeInTheDocument();
  expect(calls).toEqual([]);
});

it('가입 토큰과 함께 보내고 완료 화면을 보여 준다', async () => {
  const calls = stubApi({ 'POST /auth/social/signup': { user: { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false }, accessToken: 'a', refreshToken: 'r' } });
  render(<TestProviders><SocialSignupForm state={state} /></TestProviders>);
  await agree();
  expect(await screen.findByRole('status')).toHaveTextContent('회원 가입이 완료되었습니다.');
  expect(calls[0]?.body).toMatchObject({ signupToken: 'token', nickname: '카카오닉', agreeTerms: true, confirmAge: true });
});

it('실패하면 안내한다', async () => {
  stubApi({ 'POST /auth/social/signup': () => apiError(400, '가입 시간이 지났습니다.') });
  render(<TestProviders><SocialSignupForm state={state} /></TestProviders>);
  await agree();
  expect(await screen.findByRole('alert')).toHaveTextContent('가입 시간이 지났습니다.');
});
