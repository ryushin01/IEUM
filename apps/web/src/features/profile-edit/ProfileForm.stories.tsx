import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileForm } from './ProfileForm';

const meta: Meta<typeof ProfileForm> = {
  title: 'features/ProfileForm',
  component: ProfileForm,
  args: { me: { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false } },
};
export default meta;
export const Default: StoryObj<typeof ProfileForm> = {};
