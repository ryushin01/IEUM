import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removePost } from '@/entities/post';
import { request } from '@/shared/api';

export function useDeletePost() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => request(`/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: (_, postId) => removePost(client, postId),
  });
}
