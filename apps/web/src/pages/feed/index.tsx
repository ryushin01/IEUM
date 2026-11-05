import { usePageTitle } from '@/shared/lib';
import { srOnly } from '@/shared/ui';
import { PostFeed } from '@/widgets/post-card';

export function FeedPage() {
  usePageTitle('피드');
  return (
    <>
      <h1 className={srOnly}>피드</h1>
      <PostFeed />
    </>
  );
}
