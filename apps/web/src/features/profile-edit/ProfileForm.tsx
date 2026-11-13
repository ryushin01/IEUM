import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { invalidatePosts } from '@/entities/post';
import { setMe, type Me } from '@/entities/session';
import { userKey } from '@/entities/user';
import { imageErrorMessage, pickAndUploadImages, request } from '@/shared/api';
import { InterestChips, UserAvatar } from '@/shared/ui';
import * as s from './ProfileForm.css';

interface Values { nickname: string; bio: string }

export function ProfileForm({ me }: { me: Me }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [avatarUrl, setAvatarUrl] = useState(me.avatarUrl);
  const [interests, setInterests] = useState(me.interests);
  const [uploading, setUploading] = useState(false);
  const save = useMutation({
    mutationFn: (data: Values & { avatarUrl: string | null; interests: string[] }) =>
      request<Me>('/me', { method: 'PATCH', body: data }),
    onSuccess: async (updated) => {
      setMe(client, updated);
      await Promise.all([invalidatePosts(client), client.invalidateQueries({ queryKey: userKey(me.id) })]);
      navigate('/me', { replace: true });
    },
  });
  const changeAvatar = async () => {
    setUploading(true);
    try {
      const [url] = await pickAndUploadImages('gallery', 1);
      if (url) setAvatarUrl(url);
    } catch (error) {
      void message.error(imageErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };
  return (
    <Form<Values>
      layout="vertical"
      className={s.form}
      requiredMark={false}
      initialValues={{ nickname: me.nickname, bio: me.bio }}
      onFinish={(values) => { if (!save.isPending) save.mutate({ ...values, avatarUrl, interests }); }}
    >
      <div className={s.avatarRow}>
        <UserAvatar nickname={me.nickname} src={avatarUrl} size={72} decorative={false} />
        <Button loading={uploading} onClick={() => void changeAvatar()}>사진 변경</Button>
        {avatarUrl && <Button type="text" onClick={() => setAvatarUrl(null)}>사진 삭제</Button>}
      </div>
      <Form.Item label="닉네임" name="nickname" rules={[{ required: true, pattern: /^[\p{L}\p{N}_.]{2,20}$/u, message: '2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.' }]}>
        <Input autoComplete="nickname" maxLength={20} />
      </Form.Item>
      <Form.Item label="소개" name="bio">
        <Input.TextArea rows={3} maxLength={150} showCount />
      </Form.Item>
      <Form.Item><InterestChips value={interests} onChange={setInterests} /></Form.Item>
      {save.error && <Form.Item><Alert type="error" title={save.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={save.isPending} disabled={uploading}>저장</Button>
    </Form>
  );
}
