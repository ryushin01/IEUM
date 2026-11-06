import { isNativeApp } from '@/shared/bridge';
import { usePageTitle } from '@/shared/lib';
import { srOnly } from '@/shared/ui';
import { PostFeed } from '@/widgets/post-card';

export function FeedPage() {
  usePageTitle('피드');
  // 앱에서는 Flutter 위젯이 피드를 그립니다.
  if (isNativeApp()) return null;
  return (
    <>
      <h1 className={srOnly}>피드</h1>
      <PostFeed />
    </>
  );
}
