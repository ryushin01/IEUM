import type { Meta, StoryObj } from '@storybook/react-vite';
import { LikeButton } from './LikeButton';

const post = {
  id: 'p1',
  author: { id: 'u1', nickname: '하늘빛', avatarUrl: null, isOfficial: true },
  isHot: false,
  caption: '내용',
  images: [],
  likeCount: 3,
  commentCount: 1,
  liked: false,
  createdAt: '2026-11-01T00:00:00Z',
  edited: false,
};

const meta: Meta<typeof LikeButton> = { title: 'features/LikeButton', component: LikeButton, args: { post } };
export default meta;
export const NotLiked: StoryObj<typeof LikeButton> = {};
export const Liked: StoryObj<typeof LikeButton> = { args: { post: { ...post, liked: true } } };
