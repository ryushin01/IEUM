import { Navigate, useParams } from 'react-router';
import { usePost } from '@/entities/post';
import { useMe } from '@/entities/session';
import { EditPostForm } from '@/features/post-editor';
import { usePageTitle } from '@/shared/lib';
import { ErrorView, LoadingView, srOnly } from '@/shared/ui';

export function PostEditPage() {
  const { id = '' } = useParams();
  const post = usePost(id);
  const me = useMe();
  usePageTitle('게시글 수정');
  if (post.isPending || me.isPending) return <LoadingView />;
  if (post.isError) return <ErrorView error={post.error} onRetry={() => void post.refetch()} />;
  if (me.data?.id !== post.data.author.id) return <Navigate to={`/posts/${id}`} replace />;
  return (
    <>
      <h1 className={srOnly}>게시글 수정</h1>
      <EditPostForm post={post.data} />
    </>
  );
}
