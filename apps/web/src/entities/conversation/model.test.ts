import { QueryClient, type InfiniteData } from '@tanstack/react-query';
import { expect, it } from 'vitest';
import type { Page } from '@/shared/api';
import { addMessage, messagesKey, type Message } from './model';

const message = (id: string): Message => ({
  id, conversationId: 'c1', senderId: 'u', body: id, readAt: null, createdAt: '2026-11-05T00:00:00Z',
});

it('같은 메시지가 응답과 소켓으로 와도 한 번만 넣고 최신을 앞에 둔다', () => {
  const client = new QueryClient();
  client.setQueryData<InfiniteData<Page<Message>>>(messagesKey('c1'), {
    pages: [{ items: [message('old')], nextCursor: null }],
    pageParams: [null],
  });
  addMessage(client, message('new'));
  addMessage(client, message('new'));
  const data = client.getQueryData<InfiniteData<Page<Message>>>(messagesKey('c1'));
  expect(data?.pages[0]?.items.map((m) => m.id)).toEqual(['new', 'old']);
});
