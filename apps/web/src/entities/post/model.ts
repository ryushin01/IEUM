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

/** 작성자의 글이나 내가 좋아요한 글로 좁힙니다. 없으면 전체 피드입니다. */
export interface PostFilter {
  authorId?: string;
  liked?: boolean;
}

const feedKey = ({ authorId, liked }: PostFilter) => ['posts', liked ? 'liked' : authorId ?? 'all'] as const;
export const postKey = (id: string) => ['post', id] as const;
export const commentsKey = (id: string) => ['comments', id] as const;

export const usePostFeed = (filter: PostFilter = {}) =>
  useInfiniteQuery({
    queryKey: feedKey(filter),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams();
      if (filter.authorId) params.set('authorId', filter.authorId);
      if (filter.liked) params.set('liked', 'true');
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

/** 좋아요를 바꾸면 목록에 글이 들어오거나 빠집니다. */
export const invalidateLikedPosts = (client: QueryClient) => client.invalidateQueries({ queryKey: ['posts', 'liked'] });

export const invalidatePosts = (client: QueryClient) => client.invalidateQueries({ queryKey: ['posts'] });
