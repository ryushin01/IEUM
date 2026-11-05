import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from 'antd';
import { ReportCard } from './ReportCard';

const meta: Meta<typeof ReportCard> = {
  title: 'features/ReportCard',
  component: ReportCard,
  decorators: [(Story) => (
    <QueryClientProvider client={new QueryClient()}>
      <App><main style={{ maxWidth: 390 }}><ul style={{ listStyle: 'none', margin: 0, padding: 0 }}><Story /></ul></main></App>
    </QueryClientProvider>
  )],
  args: {
    report: {
      targetType: 'post', targetId: '1', count: 2, reasons: ['스팸·광고', '욕설·혐오 표현'], firstReportedAt: '2026-11-01T00:00:00Z', overdue: false,
      preview: { text: '신고된 게시글 내용입니다.', imageUrl: null, authorId: 'u1', authorNickname: '하늘빛' },
    },
  },
};
export default meta;
export const Open: StoryObj<typeof ReportCard> = {};
export const Overdue: StoryObj<typeof ReportCard> = { args: { report: { ...meta.args!.report!, overdue: true } } };
export const AlreadyDeleted: StoryObj<typeof ReportCard> = { args: { report: { ...meta.args!.report!, preview: null } } };
