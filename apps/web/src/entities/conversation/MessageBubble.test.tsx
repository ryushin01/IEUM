import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { MessageBubble } from './MessageBubble';

const message = { id: 'm', conversationId: 'c', senderId: 'u', body: '안녕하세요', readAt: new Date().toISOString(), createdAt: new Date().toISOString() };

it('내 메시지는 읽음을 표시하고 낭독으로 구분한다', () => {
  render(<ul><MessageBubble message={message} mine /></ul>);
  expect(screen.getByText('내가 보낸 메시지')).toBeInTheDocument();
  expect(screen.getByText(/읽음/)).toBeInTheDocument();
});

it('받은 메시지에는 읽음을 표시하지 않는다', () => {
  render(<ul><MessageBubble message={message} mine={false} /></ul>);
  expect(screen.getByText('받은 메시지')).toBeInTheDocument();
  expect(screen.queryByText(/읽음/)).toBeNull();
});

it('상대가 읽기 전에는 읽음을 표시하지 않는다', () => {
  render(<ul><MessageBubble message={{ ...message, readAt: null }} mine /></ul>);
  expect(screen.queryByText(/읽음/)).toBeNull();
});
