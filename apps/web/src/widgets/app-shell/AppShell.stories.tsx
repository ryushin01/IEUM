import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CONVERSATIONS_KEY } from '@/entities/conversation';
import { AppShell } from './AppShell';

const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
client.setQueryData(CONVERSATIONS_KEY, [{ id: 'c1', unreadCount: 3 }]);

const meta: Meta<typeof AppShell> = {
  title: 'widgets/AppShell',
  component: AppShell,
  decorators: [(Story) => <QueryClientProvider client={client}><Story /></QueryClientProvider>],
  // 미리보기가 <main>으로 감싸므로 랜드마크 중첩 검사만 끕니다. 실제 화면은 E2E의 axe로 확인합니다.
  parameters: { a11y: { config: { rules: [
    { id: 'landmark-main-is-top-level', enabled: false },
    { id: 'landmark-banner-is-top-level', enabled: false },
    { id: 'landmark-no-duplicate-main', enabled: false },
    { id: 'landmark-unique', enabled: false },
  ] } } },
};
export default meta;
export const Default: StoryObj<typeof AppShell> = {};
