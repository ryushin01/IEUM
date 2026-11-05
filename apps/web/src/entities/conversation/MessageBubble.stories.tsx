import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageBubble } from './MessageBubble';

const message = { id: '1', conversationId: 'c', senderId: 'u', body: '안녕하세요! 사진 잘 보고 있어요 :)', readAt: '2026-11-01T00:00:00Z', createdAt: '2026-11-01T00:00:00Z' };

const meta: Meta<typeof MessageBubble> = {
  title: 'entities/MessageBubble',
  component: MessageBubble,
  decorators: [(Story) => <ul style={{ listStyle: 'none', padding: 16, maxWidth: 360 }}><Story /></ul>],
  args: { message },
};
export default meta;
export const Mine: StoryObj<typeof MessageBubble> = { args: { mine: true } };
export const Other: StoryObj<typeof MessageBubble> = { args: { mine: false } };
