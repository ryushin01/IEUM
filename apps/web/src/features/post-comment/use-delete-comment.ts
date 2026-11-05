import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsKey, patchPost, type Comment } from '@/entities/post';
import { request } from '@/shared/api';

export function useDeleteComment(postId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => request(`/comments/${commentId}`, { method: 'DELETE' }),
    onSuccess: (_, commentId) => {
      client.setQueryData<Comment[]>(commentsKey(postId), (list) => list?.filter((c) => c.id !== commentId));
      patchPost(client, postId, (p) => ({ ...p, commentCount: p.commentCount - 1 }));
    },
  });
}
