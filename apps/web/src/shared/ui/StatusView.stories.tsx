import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyView, ErrorView, LoadingView } from './StatusView';

const meta: Meta = { title: 'shared/StatusView' };
export default meta;
export const Loading: StoryObj = { render: () => <LoadingView /> };
export const Failed: StoryObj = { render: () => <ErrorView error="네트워크 연결을 확인해 주세요." onRetry={() => {}} /> };
export const Empty: StoryObj = { render: () => <EmptyView title="아직 게시글이 없습니다." /> };
