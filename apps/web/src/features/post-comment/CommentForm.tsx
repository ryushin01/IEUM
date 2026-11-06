import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Input } from 'antd';
import { useId, useState, type FormEvent } from 'react';
import { commentsKey, patchPost, type Comment } from '@/entities/post';
import { request } from '@/shared/api';
import { srOnly } from '@/shared/ui';
import * as s from './CommentForm.css';

export function CommentForm({ postId }: { postId: string }) {
  const client = useQueryClient();
  const inputId = useId();
  const [body, setBody] = useState('');
  const create = useMutation({
    mutationFn: (data: { body: string }) =>
      request<Comment>(`/posts/${postId}/comments`, { method: 'POST', body: data }),
    onSuccess: (comment) => {
      // 아직 받지 않은 목록을 새 댓글 하나로 채우지 않습니다.
      client.setQueryData<Comment[]>(commentsKey(postId), (list) => list && [...list, comment]);
      patchPost(client, postId, (p) => ({ ...p, commentCount: p.commentCount + 1 }));
      setBody('');
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (body.trim() && !create.isPending) create.mutate({ body });
  };
  return (
    <form className={s.form} onSubmit={submit}>
      <div className={s.row}>
        <label htmlFor={inputId} className={srOnly}>댓글</label>
        <Input id={inputId} variant="borderless" placeholder="댓글 쓰기 (최대 100자)" maxLength={100} value={body} onChange={(e) => setBody(e.target.value)} />
        <Button className={s.submit} htmlType="submit" type="text" loading={create.isPending} disabled={!body.trim()}>게시</Button>
      </div>
      {create.error && <Alert className={s.error} type="error" title={create.error.message} />}
    </form>
  );
}
