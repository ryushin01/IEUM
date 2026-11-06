import type { Meta, StoryObj } from '@storybook/react-vite';
import { PostForm } from './PostForm';

const meta: Meta<typeof PostForm> = { title: 'features/PostForm', component: PostForm };
export default meta;
export const Empty: StoryObj<typeof PostForm> = {};
