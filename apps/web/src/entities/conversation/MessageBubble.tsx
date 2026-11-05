import { timeAgo } from '@/shared/lib';
import { srOnly } from '@/shared/ui';
import * as s from './MessageBubble.css';
import type { Message } from './model';

export function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  const kind = mine ? 'mine' : 'other';
  return (
    <li className={s.row[kind]}>
      <span className={srOnly}>{mine ? '내가 보낸 메시지' : '받은 메시지'}</span>
      <span className={s.bubble[kind]}>{message.body}</span>
      <span className={s.meta}>
        {timeAgo(message.createdAt)}{mine && message.readAt ? ' · 읽음' : ''}
      </span>
    </li>
  );
}
