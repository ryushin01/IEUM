import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router';
import { ME_KEY, type Me } from '@/entities/session';
import { request, setSession } from '@/shared/api';

interface Values { email: string; password: string }
interface AuthResponse { user: Me; accessToken: string; refreshToken: string }

export function LoginForm() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const login = useMutation({
    mutationFn: (values: Values) => request<AuthResponse>('/auth/login', { method: 'POST', body: values }),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      await setSession({ accessToken, refreshToken });
      client.setQueryData(ME_KEY, user);
      navigate('/', { replace: true });
    },
  });
  return (
    <Form<Values> noValidate layout="vertical" requiredMark={false} onFinish={(values) => { if (!login.isPending) login.mutate(values); }}>
      <Form.Item label="이메일" name="email" rules={[{ required: true, type: 'email', message: '이메일을 입력해 주세요.' }]}>
        <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" />
      </Form.Item>
      <Form.Item label="비밀번호" name="password" rules={[{ required: true, message: '비밀번호를 입력해 주세요.' }]}>
        <Input.Password autoComplete="current-password" visibilityToggle={false} />
      </Form.Item>
      {login.error && <Form.Item><Alert type="error" title={login.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={login.isPending}>로그인</Button>
    </Form>
  );
}
