import type { Meta, StoryObj } from '@storybook/react-vite';
import { EditPostForm } from './EditPostForm';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0b6be0"/></svg>')}`;

const meta: Meta<typeof EditPostForm> = {
  title: 'features/EditPostForm',
  component: EditPostForm,
  args: { post: {
  id: 'p1',
  author: { id: 'u1', nickname: '하늘빛', avatarUrl: null, isOfficial: false },
  isHot: false,
  caption: '퇴근길 하늘',
  images: [{ url: IMAGE, alt: '노을 그림' }],
  likeCount: 3,
  commentCount: 2,
  liked: false,
  createdAt: '2026-11-01T00:00:00Z',
  edited: false,
} },
};
export default meta;
export const Default: StoryObj<typeof EditPostForm> = {};
