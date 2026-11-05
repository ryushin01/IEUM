import { App, Button } from 'antd';
import { Navigate } from 'react-router';
import { useMe } from '@/entities/session';
import { ReportCard, useLiftSuspension, useOpenReports, useSuspendedUsers } from '@/features/report-review';
import { timeAgo, usePageTitle } from '@/shared/lib';
import { EmptyView, ErrorView, LoadingView } from '@/shared/ui';

const titleStyle = { padding: '16px 16px 8px', fontSize: 22, fontWeight: 800 };

export function AdminReportsPage() {
  usePageTitle('신고 처리');
  const me = useMe();
  if (me.isPending) return <LoadingView />;
  if (!me.data?.isAdmin) return <Navigate to="/" replace />;
  return (
    <>
      <h1 style={titleStyle}>신고 처리</h1>
      <Reports />
      <Suspended />
    </>
  );
}

function Reports() {
  const reports = useOpenReports();
  if (reports.isPending) return <LoadingView label="신고를 불러오는 중" />;
  if (reports.isError) return <ErrorView error={reports.error} onRetry={() => void reports.refetch()} />;
  if (reports.data.length === 0) return <EmptyView title="처리할 신고가 없습니다." />;
  return (
    <ul>
      {reports.data.map((report) => <ReportCard key={`${report.targetType}-${report.targetId}`} report={report} />)}
    </ul>
  );
}

function Suspended() {
  const users = useSuspendedUsers();
  const lift = useLiftSuspension();
  const { message } = App.useApp();
  if (!users.data?.length) return null;
  return (
    <section aria-labelledby="suspended-title">
      <h2 id="suspended-title" style={{ ...titleStyle, fontSize: 18 }}>정지된 사용자</h2>
      <ul>
        {users.data.map((user) => (
          <li key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
            <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{user.nickname} · {timeAgo(user.suspendedAt)}</span>
            <Button
              aria-label={`${user.nickname} 님 정지 해제`}
              disabled={lift.isPending}
              onClick={() => lift.mutate(user.id, { onError: (error) => void message.error(error.message) })}
            >
              해제
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
