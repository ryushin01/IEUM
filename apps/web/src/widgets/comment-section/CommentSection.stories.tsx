import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { commentsKey } from '@/entities/post';
import { ME_KEY } from '@/entities/session';
import { CommentSection } from './CommentSection';

const seeded = (comments: unknown[]) => {
  const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });
  client.setQueryData(ME_KEY, { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false });
  client.setQueryData(commentsKey('p1'), comments);
  return client;
};
const comment = { id: 'c1', postId: 'p1', author: { id: 'u2', nickname: '소라_기록', avatarUrl: null }, body: '색이 정말 곱네요!', createdAt: '2026-11-01T00:00:00Z' };

const meta: Meta<typeof CommentSection> = { title: 'widgets/CommentSection', component: CommentSection, args: { postId: 'p1', postAuthorId: 'me' } };
export default meta;
export const WithComments: StoryObj<typeof CommentSection> = {
  decorators: [(Story) => <QueryClientProvider client={seeded([comment])}><Story /></QueryClientProvider>],
};
export const Empty: StoryObj<typeof CommentSection> = {
  decorators: [(Story) => <QueryClientProvider client={seeded([])}><Story /></QueryClientProvider>],
};
