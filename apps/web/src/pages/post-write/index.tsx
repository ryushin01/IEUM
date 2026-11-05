import { PostForm } from '@/features/post-editor';
import { usePageTitle } from '@/shared/lib';
import { srOnly } from '@/shared/ui';

export function PostWritePage() {
  usePageTitle('새 게시글');
  return (
    <>
      <h1 className={srOnly}>새 게시글</h1>
      <PostForm />
    </>
  );
}
