import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ME_KEY } from '@/entities/session';
import { PostFeed } from './PostFeed';

const IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#0b6be0"/></svg>')}`;

const post = {
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
};
const seeded = (items: typeof post[], nextCursor: string | null) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(ME_KEY, { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false });
  client.setQueryData(['posts', 'all'], { pages: [{ items, nextCursor }], pageParams: [null] });
  return client;
};

const meta: Meta<typeof PostFeed> = { title: 'widgets/PostFeed', component: PostFeed };
export default meta;
export const WithPosts: StoryObj<typeof PostFeed> = {
  decorators: [(Story) => <QueryClientProvider client={seeded([post, { ...post, id: 'p2', caption: '두 번째 글' }], null)}><Story /></QueryClientProvider>],
};
export const HasNextPage: StoryObj<typeof PostFeed> = {
  decorators: [(Story) => <QueryClientProvider client={seeded([post], 'next')}><Story /></QueryClientProvider>],
};
export const Empty: StoryObj<typeof PostFeed> = {
  decorators: [(Story) => <QueryClientProvider client={seeded([], null)}><Story /></QueryClientProvider>],
};
