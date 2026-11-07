import { Link } from 'react-router';
import { usePageTitle } from '@/shared/lib';
import { EmptyView } from '@/shared/ui';

export function NotFoundPage() {
  usePageTitle('페이지를 찾을 수 없음');
  return (
    <main>
      <h1 style={{ padding: '48px 16px 0', textAlign: 'center', fontSize: 20, fontWeight: 700 }}>페이지를 찾을 수 없습니다</h1>
      <EmptyView title="주소가 바뀌었거나 삭제된 페이지입니다." action={<Link to="/">홈으로</Link>} />
    </main>
  );
}
