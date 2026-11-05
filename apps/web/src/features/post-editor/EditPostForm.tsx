import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router';
import { patchPost, type Post } from '@/entities/post';
import { request } from '@/shared/api';
import * as s from './PostForm.css';

export function EditPostForm({ post }: { post: Post }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const update = useMutation({
    mutationFn: (data: { caption: string }) =>
      request<Post>(`/posts/${post.id}`, { method: 'PATCH', body: data }),
    onSuccess: (updated) => {
      patchPost(client, post.id, () => updated);
      navigate(`/posts/${post.id}`, { replace: true });
    },
  });
  return (
    <Form<{ caption: string }>
      layout="vertical"
      className={s.form}
      requiredMark={false}
      initialValues={{ caption: post.caption }}
      onFinish={(values) => { if (!update.isPending) update.mutate(values); }}
    >
      <Form.Item label="내용" name="caption" rules={[{ required: true, whitespace: true, message: '내용을 입력해 주세요.' }]}>
        <Input.TextArea rows={6} maxLength={2200} showCount />
      </Form.Item>
      {update.error && <Form.Item><Alert type="error" title={update.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={update.isPending}>저장</Button>
    </Form>
  );
}
