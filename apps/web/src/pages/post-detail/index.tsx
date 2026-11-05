import { useParams } from 'react-router';
import { usePost } from '@/entities/post';
import { usePageTitle } from '@/shared/lib';
import { ErrorView, LoadingView, srOnly } from '@/shared/ui';
import { CommentSection } from '@/widgets/comment-section';
import { PostCard } from '@/widgets/post-card';

export function PostDetailPage() {
  const { id = '' } = useParams();
  const post = usePost(id);
  usePageTitle('게시글');
  if (post.isPending) return <LoadingView label="게시글을 불러오는 중" />;
  if (post.isError) return <ErrorView error={post.error} onRetry={() => void post.refetch()} />;
  return (
    <>
      <h1 className={srOnly}>{post.data.author.nickname} 님의 게시글</h1>
      <PostCard post={post.data} />
      <CommentSection postId={id} postAuthorId={post.data.author.id} />
    </>
  );
}
