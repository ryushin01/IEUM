import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { ME_KEY, type Me } from '@/entities/session';
import { request, setSession } from '@/shared/api';
import { InterestChips } from '@/shared/ui';
import { ConsentFields, NicknameField, SignupComplete } from './signup-parts';

interface Values {
  email: string;
  password: string;
  passwordCheck: string;
  nickname: string;
  agreeTerms: boolean;
  confirmAge: boolean;
}
interface AuthResponse { user: Me; accessToken: string; refreshToken: string }

const PASSWORD = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,72}$/;

export function SignupForm() {
  const client = useQueryClient();
  const [form] = Form.useForm<Values>();
  const [interests, setInterests] = useState<string[]>([]);
  const [created, setCreated] = useState<Me | null>(null);

  const signup = useMutation({
    mutationFn: (data: Omit<Values, 'passwordCheck'> & { interests: string[] }) =>
      request<AuthResponse>('/auth/signup', { method: 'POST', body: data }),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      await setSession({ accessToken, refreshToken });
      client.setQueryData(ME_KEY, user);
      setCreated(user);
    },
  });

  if (created) return <SignupComplete me={created} />;

  return (
    <Form<Values>
      noValidate
      form={form}
      layout="vertical"
      requiredMark={false}
      onFinish={({ email, password, nickname: name, agreeTerms, confirmAge }) => {
        if (!signup.isPending) signup.mutate({ email, password, nickname: name, agreeTerms, confirmAge, interests });
      }}
    >
      <Form.Item label="이메일" name="email" rules={[{ required: true, type: 'email', message: '이메일 형식을 확인해 주세요.' }]}>
        <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" />
      </Form.Item>
      <NicknameField form={form} />
      <Form.Item
        label="비밀번호"
        name="password"
        extra="영문, 숫자, 특수문자(!@#$%^*+=-)를 포함해 8자 이상"
        rules={[{ required: true, pattern: PASSWORD, message: '영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.' }]}
      >
        <Input.Password autoComplete="new-password" visibilityToggle={false} />
      </Form.Item>
      <Form.Item
        label="비밀번호 확인"
        name="passwordCheck"
        dependencies={['password']}
        rules={[
          { required: true, message: '같은 비밀번호를 입력해 주세요.' },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('같은 비밀번호를 입력해 주세요.')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" visibilityToggle={false} />
      </Form.Item>
      <Form.Item><InterestChips value={interests} onChange={setInterests} /></Form.Item>
      <ConsentFields />
      {signup.error && <Form.Item><Alert type="error" title={signup.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={signup.isPending}>회원 가입</Button>
    </Form>
  );
}
