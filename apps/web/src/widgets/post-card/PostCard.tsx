import { useNavigate } from 'react-router';
import { PostCardView, type Post } from '@/entities/post';
import { useMe } from '@/entities/session';
import { CommentForm } from '@/features/post-comment';
import { LikeButton } from '@/features/post-like';
import { UserAvatar } from '@/shared/ui';
import * as s from './PostCard.css';
import { PostActionsMenu } from './PostActionsMenu';

/** sprout처럼 목록에서 댓글 전체 보기와 바로 쓰기를 제공합니다. 상세 화면은 댓글 영역을 따로 둡니다. */
export function PostCard({ post, list }: { post: Post; list?: boolean }) {
  const navigate = useNavigate();
  const { data: me } = useMe();
  return (
    <PostCardView
      post={post}
      clamp={list}
      menu={<PostActionsMenu post={post} />}
      actions={<LikeButton post={post} />}
      footer={list && (
        <>
          <button type="button" className={s.allComments} onClick={() => void navigate(`/posts/${post.id}`)}>
            댓글 {post.commentCount.toLocaleString()}개 모두 보기
          </button>
          <div className={s.write}>
            {me && <UserAvatar nickname={me.nickname} src={me.avatarUrl} size={24} />}
            <CommentForm postId={post.id} />
          </div>
        </>
      )}
    />
  );
}
