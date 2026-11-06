import { MessageOutlined } from '@ant-design/icons';
import { Link } from 'react-router';
import { PostCardView, type Post } from '@/entities/post';
import { useMe } from '@/entities/session';
import { CommentForm } from '@/features/post-comment';
import { LikeButton } from '@/features/post-like';
import { srOnly, UserAvatar } from '@/shared/ui';
import * as s from './PostCard.css';
import { PostActionsMenu } from './PostActionsMenu';

/** 목록에서 댓글 보기와 바로 쓰기를 제공합니다. 상세 화면은 댓글 영역을 따로 둡니다. */
export function PostCard({ post, list }: { post: Post; list?: boolean }) {
  const { data: me } = useMe();
  return (
    <PostCardView
      post={post}
      clamp={list}
      menu={<PostActionsMenu post={post} />}
      actions={(
        <>
          <LikeButton post={post} />
          {list && <Link to={`/posts/${post.id}`} className={s.comments}><MessageOutlined aria-hidden="true" />댓글 보기<span className={srOnly}>: {post.author.nickname} 님의 게시글</span></Link>}
        </>
      )}
      footer={list && (
        <div className={s.write}>
          {me && <UserAvatar nickname={me.nickname} src={me.avatarUrl} size={32} />}
          <CommentForm postId={post.id} />
        </div>
      )}
    />
  );
}
