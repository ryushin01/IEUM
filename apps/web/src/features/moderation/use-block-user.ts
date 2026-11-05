import { useMutation, useQueryClient } from '@tanstack/react-query';
import { request } from '@/shared/api';

/** 차단하면 글, 댓글, DM이 서로 보이지 않으므로 관련 목록을 모두 새로 받습니다. */
export function useBlockUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, block }: { userId: string; block: boolean }) =>
      request(`/users/${userId}/block`, { method: block ? 'PUT' : 'DELETE' }),
    onSuccess: () => {
      for (const key of ['posts', 'post', 'comments', 'conversations', 'user', 'blocks']) {
        void client.invalidateQueries({ queryKey: [key] });
      }
    },
  });
}
