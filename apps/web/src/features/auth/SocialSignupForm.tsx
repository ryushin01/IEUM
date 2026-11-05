import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form } from 'antd';
import { useState } from 'react';
import { ME_KEY, type Me } from '@/entities/session';
import { request, setSession } from '@/shared/api';
import { InterestChips } from '@/shared/ui';
import { ConsentFields, NicknameField, SignupComplete } from './signup-parts';
import type { SocialSignupState } from './social';

interface Values { nickname: string; agreeTerms: boolean; confirmAge: boolean }
interface AuthResponse { user: Me; accessToken: string; refreshToken: string }

export function SocialSignupForm({ state }: { state: SocialSignupState }) {
  const client = useQueryClient();
  const [form] = Form.useForm<Values>();
  const [interests, setInterests] = useState<string[]>([]);
  const [created, setCreated] = useState<Me | null>(null);
  const signup = useMutation({
    mutationFn: (data: Values & { signupToken: string; interests: string[] }) =>
      request<AuthResponse>('/auth/social/signup', { method: 'POST', body: data }),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      await setSession({ accessToken, refreshToken });
      client.setQueryData(ME_KEY, user);
      setCreated(user);
    },
  });
  if (created) return <SignupComplete me={created} />;
  return (
    <Form<Values>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={{ nickname: state.nickname }}
      onFinish={(values) => {
        if (!signup.isPending) signup.mutate({ ...values, signupToken: state.signupToken, interests });
      }}
    >
      <NicknameField form={form} />
      <Form.Item><InterestChips value={interests} onChange={setInterests} /></Form.Item>
      <ConsentFields />
      {signup.error && <Form.Item><Alert type="error" title={signup.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={signup.isPending}>가입 완료</Button>
    </Form>
  );
}
