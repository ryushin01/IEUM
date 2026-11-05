import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageForm } from './MessageForm';

const meta: Meta<typeof MessageForm> = { title: 'features/MessageForm', component: MessageForm, args: { conversationId: 'c1' } };
export default meta;
export const Default: StoryObj<typeof MessageForm> = {};
