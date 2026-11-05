import { useInfiniteQuery, useQuery, type InfiniteData, type QueryClient } from '@tanstack/react-query';
import { request, type Page } from '@/shared/api';

interface Participant {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface ConversationSummary {
  id: string;
  other: Participant;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const CONVERSATIONS_KEY = ['conversations'] as const;
export const messagesKey = (id: string) => ['messages', id] as const;

export const useConversations = () =>
  useQuery({ queryKey: CONVERSATIONS_KEY, queryFn: () => request<ConversationSummary[]>('/conversations') });

export const useConversation = (id: string) =>
  useQuery({
    queryKey: ['conversation', id],
    queryFn: () => request<{ id: string; other: Participant; canSend: boolean }>(`/conversations/${id}`),
  });

export const useMessages = (id: string) =>
  useInfiniteQuery({
    queryKey: messagesKey(id),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      request<Page<Message>>(`/conversations/${id}/messages${pageParam ? `?cursor=${pageParam}` : ''}`, { signal }),
    getNextPageParam: (last) => last.nextCursor,
  });

/** 첫 페이지 맨 앞이 최신입니다. 보낸 응답과 소켓 이벤트가 겹쳐도 한 번만 넣습니다. */
export function addMessage(client: QueryClient, message: Message): void {
  client.setQueryData<InfiniteData<Page<Message>>>(messagesKey(message.conversationId), (data) => {
    if (!data) return data;
    if (data.pages.some((page) => page.items.some((m) => m.id === message.id))) return data;
    const [first, ...rest] = data.pages;
    return { ...data, pages: [{ nextCursor: null, ...first, items: [message, ...(first?.items ?? [])] }, ...rest] };
  });
}

export type RealtimeEvent =
  | { type: 'message'; message: Message }
  | { type: 'read'; conversationId: string };

export function applyRealtimeEvent(client: QueryClient, event: RealtimeEvent): void {
  if (event.type === 'message') {
    addMessage(client, event.message);
    void client.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    return;
  }
  void client.invalidateQueries({ queryKey: messagesKey(event.conversationId) });
}

export const refreshConversations = (client: QueryClient) =>
  Promise.all([
    client.invalidateQueries({ queryKey: CONVERSATIONS_KEY }),
    client.invalidateQueries({ queryKey: ['messages'] }),
  ]);
