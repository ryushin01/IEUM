import { LikeFilled, LikeOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Button } from 'antd';
import { patchPost, type Post } from '@/entities/post';
import { request } from '@/shared/api';
import { callNative, isNativeApp } from '@/shared/bridge';
import { srOnly } from '@/shared/ui';
import * as s from './LikeButton.css';

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
      className={s.like}
      aria-pressed={post.liked}
      icon={post.liked ? <LikeFilled aria-hidden="true" /> : <LikeOutlined aria-hidden="true" />}
      onClick={() => { if (!toggle.isPending) toggle.mutate(!post.liked); }}
    >
      좋아요<span className={srOnly}> {post.likeCount}개</span>
    </Button>
  );
}
