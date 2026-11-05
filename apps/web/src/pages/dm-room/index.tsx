import { MoreOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Dropdown } from 'antd';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import { CONVERSATIONS_KEY, MessageBubble, useConversation, useMessages } from '@/entities/conversation';
import { useMe } from '@/entities/session';
import { ReportDialog, type ReportTarget } from '@/features/moderation';
import { MessageForm } from '@/features/send-message';
import { request } from '@/shared/api';
import { isNativeApp } from '@/shared/bridge';
import { usePageTitle } from '@/shared/lib';
import { ErrorView, LoadingView, UserAvatar } from '@/shared/ui';
import * as s from './DmRoom.css';

/** 앱에서는 Flutter 위젯이 그립니다. */
export function DmRoomPage() {
  return isNativeApp() ? null : <DmRoom />;
}

function DmRoom() {
  const { id = '' } = useParams();
  const client = useQueryClient();
  const me = useMe();
  const conversation = useConversation(id);
  const messages = useMessages(id);
  const log = useRef<HTMLDivElement>(null);
  const [report, setReport] = useState<ReportTarget | null>(null);
  usePageTitle(conversation.data ? `${conversation.data.other.nickname} 님과의 대화` : '대화');

  // 서버는 최신순으로 주므로 뒤집어 오래된 메시지부터 표시합니다.
  const items = messages.data?.pages.flatMap((page) => page.items).reverse() ?? [];
  const newestId = items.at(-1)?.id;
  const newestFromOther = items.at(-1) && items.at(-1)?.senderId !== me.data?.id;

  useLayoutEffect(() => {
    if (newestId && log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [newestId]);

  useEffect(() => {
    if (!newestId || !newestFromOther) return;
    void request(`/conversations/${id}/read`, { method: 'POST' })
      .then(() => client.invalidateQueries({ queryKey: CONVERSATIONS_KEY }))
      .catch(() => {});
  }, [id, newestId, newestFromOther, client]);

  if (conversation.isPending || messages.isPending) return <LoadingView label="대화를 불러오는 중" />;
  if (conversation.isError) return <ErrorView error={conversation.error} onRetry={() => void conversation.refetch()} />;
  if (messages.isError) return <ErrorView error={messages.error} onRetry={() => void messages.refetch()} />;
  const { other, canSend } = conversation.data;

  return (
    <div className={s.room}>
      <div className={s.head}>
        <Link className={s.peer} to={`/users/${other.id}`}>
          <UserAvatar nickname={other.nickname} src={other.avatarUrl} size={32} />
          <h1 className={s.name}>{other.nickname}</h1>
        </Link>
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [{ key: 'report', label: '이 사용자 신고하기' }],
            onClick: () => setReport({ type: 'user', id: other.id }),
          }}
        >
          <Button type="text" aria-label="대화 메뉴" icon={<MoreOutlined aria-hidden="true" />} />
        </Dropdown>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- 키보드로 스크롤할 수 있어야 합니다. */}
      <div ref={log} className={s.log} role="log" aria-label="메시지" tabIndex={0}>
        {messages.hasNextPage && (
          <Button block style={{ marginBottom: 12 }} loading={messages.isFetchingNextPage} onClick={() => void messages.fetchNextPage()}>
            이전 메시지 보기
          </Button>
        )}
        <ul className={s.list}>
          {items.map((message) => (
            <MessageBubble key={message.id} message={message} mine={message.senderId === me.data?.id} />
          ))}
        </ul>
      </div>
      {canSend ? <MessageForm conversationId={id} /> : <p className={s.notice}>메시지를 보낼 수 없는 사용자입니다.</p>}
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </div>
  );
}
