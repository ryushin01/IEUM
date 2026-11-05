import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { jsonResponse, TestProviders } from '@/shared/lib/test-providers';
import { MessageForm } from './MessageForm';

const message = { id: 'm1', conversationId: 'c1', senderId: 'u', body: '안녕', readAt: null, createdAt: '2026-11-05T00:00:00Z' };

it('빈 내용은 보낼 수 없고, 보내면 입력창을 비운다', async () => {
  const fetchMock = vi.fn(async () => jsonResponse(201, message));
  vi.stubGlobal('fetch', fetchMock);
  render(<TestProviders><MessageForm conversationId="c1" /></TestProviders>);
  const send = screen.getByRole('button', { name: '보내기' });
  expect(send).toBeDisabled();
  await userEvent.type(screen.getByRole('textbox', { name: '메시지' }), '안녕');
  await userEvent.click(send);
  await waitFor(() => expect(screen.getByRole('textbox', { name: '메시지' })).toHaveValue(''));
  expect(JSON.parse((fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)).toEqual({ body: '안녕' });
});

it('응답을 기다리는 동안 다시 눌러도 한 번만 보낸다', async () => {
  let finish: (response: Response) => void = () => {};
  const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { finish = resolve; }));
  vi.stubGlobal('fetch', fetchMock);
  render(<TestProviders><MessageForm conversationId="c1" /></TestProviders>);
  const input = screen.getByRole('textbox', { name: '메시지' });
  await userEvent.type(input, '안녕{Enter}{Enter}');
  expect(fetchMock).toHaveBeenCalledOnce();
  finish(jsonResponse(201, message));
  await waitFor(() => expect(input).toHaveValue(''));
});

it('실패하면 오류를 보여 주고 입력한 내용을 남긴다', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(403, { code: 'forbidden', message: '메시지를 보낼 수 없는 사용자입니다.' })));
  render(<TestProviders><MessageForm conversationId="c1" /></TestProviders>);
  const input = screen.getByRole('textbox', { name: '메시지' });
  await userEvent.type(input, '안녕{Enter}');
  expect(await screen.findByRole('alert')).toHaveTextContent('메시지를 보낼 수 없는 사용자입니다.');
  expect(input).toHaveValue('안녕');
});
