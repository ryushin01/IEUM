import type { Meta, StoryObj } from '@storybook/react-vite';
import { MemoryRouter } from 'react-router';
import { PostCardView } from './PostCardView';

const image = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#c4e538"/></svg>')}`;

const meta: Meta<typeof PostCardView> = {
  title: 'entities/PostCardView',
  component: PostCardView,
  decorators: [(Story) => <MemoryRouter><main style={{ maxWidth: 390 }}><Story /></main></MemoryRouter>],
  args: {
    post: {
      id: '1',
      author: { id: 'u1', nickname: '하늘빛', avatarUrl: null, isOfficial: false },
      isHot: false,
      caption: '퇴근길 하늘이 유난히 예뻤던 날.\n다들 오늘 하루 어땠나요?',
      images: [{ url: image, alt: '연둣빛 이미지' }],
      likeCount: 3,
      commentCount: 1,
      liked: false,
      createdAt: '2026-11-01T00:00:00Z',
      edited: true,
    },
  },
};
export default meta;
export const Default: StoryObj<typeof PostCardView> = {};
export const Clamped: StoryObj<typeof PostCardView> = { args: { clamp: true } };
export const OfficialHot: StoryObj<typeof PostCardView> = {
  args: { post: { ...meta.args!.post!, isHot: true, author: { ...meta.args!.post!.author, isOfficial: true } } },
};
