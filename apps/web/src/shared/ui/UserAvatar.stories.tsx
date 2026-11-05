import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserAvatar } from './UserAvatar';

const meta: Meta<typeof UserAvatar> = { title: 'shared/UserAvatar', component: UserAvatar, args: { nickname: '이음데모', size: 48 } };
export default meta;
export const Fallback: StoryObj<typeof UserAvatar> = {};
export const Labelled: StoryObj<typeof UserAvatar> = { args: { decorative: false } };
