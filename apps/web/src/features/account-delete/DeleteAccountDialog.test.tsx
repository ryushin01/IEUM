import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { DeleteAccountDialog } from './DeleteAccountDialog';

afterEach(() => vi.unstubAllGlobals());
const button = () => screen.getByRole('button', { name: /영구 삭제/ });

it('비밀번호를 입력해야 삭제할 수 있고, 입력한 값을 보낸다', async () => {
  const calls = stubApi({ 'DELETE /me': {} });
  render(<TestProviders><DeleteAccountDialog open hasPassword onClose={() => {}} /></TestProviders>);
  expect(button()).toBeDisabled();
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'pw');
  await userEvent.click(button());
  await waitFor(() => expect(calls).toEqual([{ key: 'DELETE /me', body: { password: 'pw' } }]));
});

it('소셜 계정은 확인 문구를 보낸다', async () => {
  const calls = stubApi({ 'DELETE /me': {} });
  render(<TestProviders><DeleteAccountDialog open hasPassword={false} onClose={() => {}} /></TestProviders>);
  await userEvent.type(screen.getByLabelText(/입력해 주세요/), '삭제');
  await userEvent.click(button());
  await waitFor(() => expect(calls[0]?.body).toEqual({ confirmText: '삭제' }));
});

it('실패하면 안내한다', async () => {
  stubApi({ 'DELETE /me': () => apiError(400, '비밀번호가 올바르지 않습니다.') });
  render(<TestProviders><DeleteAccountDialog open hasPassword onClose={() => {}} /></TestProviders>);
  await userEvent.type(screen.getByLabelText('비밀번호 확인'), 'x');
  await userEvent.click(button());
  expect(await screen.findByRole('alert')).toHaveTextContent('비밀번호가 올바르지 않습니다.');
});
