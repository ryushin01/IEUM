import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { stubApi, TestProviders } from '@/shared/lib/test-providers';
import { ReportCard } from './ReportCard';
import type { ReportGroup } from './model';

afterEach(() => vi.unstubAllGlobals());

const report: ReportGroup = {
  targetType: 'post', targetId: 'p1', count: 2, reasons: ['스팸·광고', '기타 정책 위반'], firstReportedAt: new Date().toISOString(), overdue: false,
  preview: { text: '신고된 내용', imageUrl: '/a.png', authorId: 'u1', authorNickname: '하늘빛' },
};
const show = (value: ReportGroup) => render(<TestProviders><ul><ReportCard report={value} /></ul></TestProviders>);

it('건수, 사유, 내용을 보여 준다', () => {
  show(report);
  expect(screen.getByText('게시글 신고 2건')).toBeInTheDocument();
  expect(screen.getByText(/스팸·광고, 기타 정책 위반/)).toBeInTheDocument();
  expect(screen.getByRole('img', { name: '신고 대상 이미지' })).toBeInTheDocument();
  expect(screen.queryByText('24시간 초과')).toBeNull();
});

it('24시간이 지나면 표시한다', () => {
  show({ ...report, overdue: true });
  expect(screen.getByText('24시간 초과')).toBeInTheDocument();
});

it('문제 없음은 확인 없이 처리한다', async () => {
  const calls = stubApi({ 'POST /admin/reports/resolve': {} });
  show(report);
  await userEvent.click(screen.getByRole('button', { name: '문제 없음' }));
  await waitFor(() => expect(calls[0]).toEqual({ key: 'POST /admin/reports/resolve', body: { targetType: 'post', targetId: 'p1', action: 'dismiss' } }));
});

it('삭제와 정지는 확인을 거친다', async () => {
  const calls = stubApi({ 'POST /admin/reports/resolve': {} });
  show(report);
  await userEvent.click(screen.getByRole('button', { name: '콘텐츠 삭제' }));
  await screen.findByRole('dialog');
  expect(calls).toEqual([]);
  await userEvent.click(screen.getByRole('button', { name: /^삭\s*제$/ }));
  await waitFor(() => expect(calls[0]?.body).toMatchObject({ action: 'remove' }));
});

it('이미 삭제된 대상은 문제 없음만 할 수 있다', () => {
  show({ ...report, preview: null });
  expect(screen.getByText('이미 삭제된 대상입니다.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: '콘텐츠 삭제' })).toBeNull();
  expect(screen.queryByRole('button', { name: '사용자 정지' })).toBeNull();
  expect(screen.getByRole('button', { name: '문제 없음' })).toBeEnabled();
});

it('사용자 신고에는 콘텐츠 삭제가 없다', () => {
  show({ ...report, targetType: 'user' });
  expect(screen.queryByRole('button', { name: '콘텐츠 삭제' })).toBeNull();
  expect(screen.getByRole('button', { name: '사용자 정지' })).toBeInTheDocument();
});
