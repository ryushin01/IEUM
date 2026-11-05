import { useInfiniteQuery, useQuery, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { request, type Page } from '@/shared/api';

export interface Post {
  id: string;
  author: { id: string; nickname: string; avatarUrl: string | null; isOfficial: boolean };
  isHot: boolean;
  caption: string;
  images: { url: string; alt: string }[];
  likeCount: number;
  commentCount: number;
  liked: boolean;
  createdAt: string;
  edited: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  author: { id: string; nickname: string; avatarUrl: string | null };
  body: string;
  createdAt: string;
}

const feedKey = (authorId?: string) => ['posts', authorId ?? 'all'] as const;
export const postKey = (id: string) => ['post', id] as const;
export const commentsKey = (id: string) => ['comments', id] as const;

export const usePostFeed = (authorId?: string) =>
  useInfiniteQuery({
    queryKey: feedKey(authorId),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams();
      if (authorId) params.set('authorId', authorId);
      if (pageParam) params.set('cursor', pageParam);
      return request<Page<Post>>(`/posts?${params}`, { signal });
    },
    getNextPageParam: (last) => last.nextCursor,
  });

export const usePost = (id: string) =>
  useQuery({ queryKey: postKey(id), queryFn: () => request<Post>(`/posts/${id}`) });

export const useComments = (postId: string) =>
  useQuery({ queryKey: commentsKey(postId), queryFn: () => request<Comment[]>(`/posts/${postId}/comments`) });

/** 수정 결과를 목록과 상세 캐시에 함께 반영합니다. */
export function patchPost(client: QueryClient, id: string, patch: (post: Post) => Post): void {
  client.setQueriesData<InfiniteData<Page<Post>>>({ queryKey: ['posts'] }, (data) =>
    data && {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((post) => (post.id === id ? patch(post) : post)),
      })),
    });
  client.setQueryData<Post>(postKey(id), (post) => post && patch(post));
}

export function removePost(client: QueryClient, id: string): void {
  client.setQueriesData<InfiniteData<Page<Post>>>({ queryKey: ['posts'] }, (data) =>
    data && {
      ...data,
      pages: data.pages.map((page) => ({ ...page, items: page.items.filter((post) => post.id !== id) })),
    });
  client.removeQueries({ queryKey: postKey(id) });
}

export const invalidatePosts = (client: QueryClient) => client.invalidateQueries({ queryKey: ['posts'] });
