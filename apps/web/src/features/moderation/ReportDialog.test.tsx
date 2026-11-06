import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { apiError, stubApi, TestProviders } from '@/shared/lib/test-providers';
import { ReportDialog } from './ReportDialog';

afterEach(() => vi.unstubAllGlobals());
const submit = () => screen.getByRole('button', { name: /^신\s*고$/ });

it('대상이 없으면 열지 않는다', () => {
  render(<TestProviders><ReportDialog target={null} onClose={() => {}} /></TestProviders>);
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('사유를 골라야 신고할 수 있고, 대상과 사유를 보낸 뒤 닫는다', async () => {
  const calls = stubApi({ 'POST /reports': {} });
  const onClose = vi.fn();
  render(<TestProviders><ReportDialog target={{ type: 'post', id: 'p1' }} onClose={onClose} /></TestProviders>);
  expect(submit()).toBeDisabled();
  await userEvent.click(screen.getByRole('radio', { name: '스팸·광고' }));
  await userEvent.click(submit());
  await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  expect(calls).toEqual([{ key: 'POST /reports', body: { targetType: 'post', targetId: 'p1', reason: '스팸·광고' } }]);
});

it('실패하면 안내하고 닫지 않는다', async () => {
  stubApi({ 'POST /reports': () => apiError(500, '접수하지 못했습니다.') });
  const onClose = vi.fn();
  render(<TestProviders><ReportDialog target={{ type: 'user', id: 'u1' }} onClose={onClose} /></TestProviders>);
  await userEvent.click(screen.getByRole('radio', { name: '기타 정책 위반' }));
  await userEvent.click(submit());
  expect(await screen.findByRole('alert')).toHaveTextContent('접수하지 못했습니다.');
  expect(onClose).not.toHaveBeenCalled();
});
