import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocialLoginButtons } from './SocialLoginButtons';

const client = new QueryClient();
client.setQueryData(['social-providers'], ['kakao', 'naver', 'google', 'apple']);

const meta: Meta<typeof SocialLoginButtons> = {
  title: 'features/SocialLoginButtons',
  component: SocialLoginButtons,
  decorators: [(Story) => (
    <QueryClientProvider client={client}>
      <Story />
    </QueryClientProvider>
  )],
};
export default meta;
export const AllProviders: StoryObj<typeof SocialLoginButtons> = {};
