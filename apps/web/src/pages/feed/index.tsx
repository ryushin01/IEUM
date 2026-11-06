import { isNativeApp } from '@/shared/bridge';
import { usePageTitle } from '@/shared/lib';
import { srOnly } from '@/shared/ui';
import { PostFeed } from '@/widgets/post-card';
import * as s from './Feed.css';

export function FeedPage() {
  usePageTitle('피드');
  // 앱에서는 Flutter 위젯이 피드를 그립니다.
  if (isNativeApp()) return null;
  return (
    <>
      <h1 className={s.hero}><span className={srOnly}>피드. </span>오늘은 누구와<br /><em className={s.emphasis}>이어져 볼까요?</em></h1>
      <PostFeed />
    </>
  );
}
