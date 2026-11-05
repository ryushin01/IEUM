import { SendOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input } from 'antd';
import { useState, type FormEvent } from 'react';
import { addMessage, CONVERSATIONS_KEY, type Message } from '@/entities/conversation';
import { request } from '@/shared/api';
import { srOnly } from '@/shared/ui';
import * as s from './MessageForm.css';

export function MessageForm({ conversationId }: { conversationId: string }) {
  const client = useQueryClient();
  const [body, setBody] = useState('');
  const send = useMutation({
    mutationFn: (data: { body: string }) =>
      request<Message>(`/conversations/${conversationId}/messages`, { method: 'POST', body: data }),
    onSuccess: (message) => {
      addMessage(client, message);
      void client.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      setBody('');
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (body.trim() && !send.isPending) send.mutate({ body });
  };
  return (
    <form className={s.form} onSubmit={submit}>
      {send.error && <Alert type="error" title={send.error.message} />}
      <div className={s.row}>
        <label htmlFor="message-body" className={srOnly}>메시지</label>
        <Input id="message-body" placeholder="메시지를 입력하세요" autoComplete="off" maxLength={1000} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button type="primary" htmlType="submit" aria-label="보내기" icon={<SendOutlined aria-hidden="true" />} loading={send.isPending} disabled={!body.trim()} />
      </div>
    </form>
  );
}
