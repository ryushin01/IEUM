import type { Meta, StoryObj } from '@storybook/react-vite';
import { SocialSignupForm } from './SocialSignupForm';

const meta: Meta<typeof SocialSignupForm> = {
  title: 'features/SocialSignupForm',
  component: SocialSignupForm,
  args: { state: { signupToken: 't', provider: 'kakao', nickname: '새싹' } },
};
export default meta;
export const Default: StoryObj<typeof SocialSignupForm> = {};
