import { HeartFilled, HeartOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button } from 'antd';
import { patchPost, type Post } from '@/entities/post';
import { request } from '@/shared/api';
import { callNative, isNativeApp } from '@/shared/bridge';
import { vars } from '@/shared/theme';
import { srOnly } from '@/shared/ui';

export function LikeButton({ post }: { post: Post }) {
  const client = useQueryClient();
  const { message } = App.useApp();
  const toggle = useMutation({
    mutationFn: (nextLiked: boolean) =>
      request<Post>(`/posts/${post.id}/like`, { method: nextLiked ? 'PUT' : 'DELETE' }),
    onMutate: (nextLiked) => {
      if (isNativeApp()) void callNative('ui.haptic').catch(() => {});
      patchPost(client, post.id, (p) => ({ ...p, liked: nextLiked, likeCount: p.likeCount + (nextLiked ? 1 : -1) }));
    },
    onSuccess: (updated) => patchPost(client, post.id, () => updated),
    onError: (error, nextLiked) => {
      patchPost(client, post.id, (p) => ({ ...p, liked: !nextLiked, likeCount: p.likeCount + (nextLiked ? -1 : 1) }));
      void message.error(error.message);
    },
  });
  return (
    <Button
      type="text"
      aria-pressed={post.liked}
      icon={post.liked ? <HeartFilled aria-hidden="true" style={{ color: vars.color.like }} /> : <HeartOutlined aria-hidden="true" />}
      onClick={() => { if (!toggle.isPending) toggle.mutate(!post.liked); }}
    >
      <span className={srOnly}>좋아요 </span>{post.likeCount}<span className={srOnly}>개</span>
    </Button>
  );
}
