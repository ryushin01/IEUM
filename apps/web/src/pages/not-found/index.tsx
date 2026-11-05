import { Link } from 'react-router';
import { usePageTitle } from '@/shared/lib';
import notFoundData from '@/shared/assets/lottie/not_found.json';
import { EmptyView, LottieImage } from '@/shared/ui';

export function NotFoundPage() {
  usePageTitle('페이지를 찾을 수 없음');
  return (
    <main>
      <h1 style={{ padding: '48px 16px 0', textAlign: 'center', fontSize: 22, fontWeight: 400 }}>페이지를 찾을 수 없습니다</h1>
      <LottieImage data={notFoundData}  />
      <EmptyView title="주소가 바뀌었거나 삭제된 페이지입니다." action={<Link to="/">홈으로</Link>} />
    </main>
  );
}
