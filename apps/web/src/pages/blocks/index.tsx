import { App, Button } from 'antd';
import { useBlockedUsers } from '@/entities/user';
import { useBlockUser } from '@/features/moderation';
import { usePageTitle } from '@/shared/lib';
import { EmptyView, ErrorView, LoadingView, UserAvatar } from '@/shared/ui';

export function BlocksPage() {
  usePageTitle('차단한 사용자');
  const blocks = useBlockedUsers();
  const unblock = useBlockUser();
  const { message } = App.useApp();
  return (
    <>
      <h1 style={{ padding: '16px 16px 8px', fontSize: 22, fontWeight: 800 }}>차단한 사용자</h1>
      {blocks.isPending && <LoadingView />}
      {blocks.isError && <ErrorView error={blocks.error} onRetry={() => void blocks.refetch()} />}
      {blocks.data?.length === 0 && <EmptyView title="차단한 사용자가 없습니다." />}
      <ul>
        {blocks.data?.map((user) => (
          <li key={user.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px' }}>
            <UserAvatar nickname={user.nickname} src={user.avatarUrl} />
            <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{user.nickname}</span>
            <Button
              aria-label={`${user.nickname} 님 차단 해제`}
              disabled={unblock.isPending}
              onClick={() => unblock.mutate({ userId: user.id, block: false }, { onError: (error) => void message.error(error.message) })}
            >
              해제
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
