import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { SocialLoginButtons } from './SocialLoginButtons';

afterEach(() => vi.unstubAllGlobals());

it('서버에 설정된 제공자만 표시한다', async () => {
  stubApi({ 'GET /auth/social/providers': ['kakao', 'apple'] });
  render(<TestProviders><SocialLoginButtons /></TestProviders>);
  expect(await screen.findByRole('button', { name: '카카오 로그인' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Apple로 로그인' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '네이버 로그인' })).toBeNull();
});

it('제공자가 없으면 영역을 표시하지 않는다', async () => {
  const calls = stubApi({ 'GET /auth/social/providers': [] });
  const { container } = render(<TestProviders><SocialLoginButtons /></TestProviders>);
  await waitFor(() => expect(calls.length).toBe(1));
  expect(container.querySelector('section')).toBeNull();
});

it('시작에 실패하면 안내하고 다시 누를 수 있다', async () => {
  stubApi({ 'GET /auth/social/providers': ['naver'], 'POST /auth/social/naver/start': () => apiError(500, '로그인을 시작할 수 없습니다.') });
  render(<TestProviders><SocialLoginButtons /></TestProviders>);
  const naver = await screen.findByRole('button', { name: '네이버 로그인' });
  await userEvent.click(naver);
  expect(await screen.findByRole('alert')).toBeInTheDocument();
  expect(naver).toBeEnabled();
});
