import type { Meta, StoryObj } from '@storybook/react-vite';
import { CommentForm } from './CommentForm';

const meta: Meta<typeof CommentForm> = { title: 'features/CommentForm', component: CommentForm, args: { postId: 'p1' } };
export default meta;
export const Default: StoryObj<typeof CommentForm> = {};
