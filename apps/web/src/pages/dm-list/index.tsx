import { Link } from 'react-router';
import { useConversations } from '@/entities/conversation';
import { isNativeApp } from '@/shared/bridge';
import { timeAgo, usePageTitle } from '@/shared/lib';
import { EmptyView, ErrorView, LoadingView, srOnly, UserAvatar } from '@/shared/ui';
import * as s from './DmList.css';

/** 앱에서는 Flutter 위젯이 그립니다. */
export function DmListPage() {
  usePageTitle('메시지');
  return isNativeApp() ? null : <DmList />;
}

function DmList() {
  const conversations = useConversations();
  return (
    <div className={s.page}>
      <h1 className={s.title}>메시지</h1>
      {conversations.isPending && <LoadingView label="대화를 불러오는 중" />}
      {conversations.isError && <ErrorView error={conversations.error} onRetry={() => void conversations.refetch()} />}
      {conversations.data?.length === 0 && <EmptyView title="프로필에서 메시지를 보내 대화를 시작해 보세요." />}
      <ul>
        {conversations.data?.map((c) => (
          <li key={c.id}>
            <Link className={s.link} to={`/dm/${c.id}`}>
              <UserAvatar nickname={c.other.nickname} src={c.other.avatarUrl} size={48} />
              <span className={s.texts}>
                <span className={s.top}>
                  <span className={s.name}>{c.other.nickname}</span>
                  <time className={s.time} dateTime={c.lastMessageAt}>{timeAgo(c.lastMessageAt)}</time>
                </span>
                <span className={s.preview} style={{ display: 'block' }}>{c.lastMessage}</span>
              </span>
              {c.unreadCount > 0 && (
                <span className={s.unread}>
                  <span className={srOnly}>읽지 않은 메시지 </span>{c.unreadCount}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
