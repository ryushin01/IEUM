import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Button } from 'antd';
import { useNavigate } from 'react-router';
import { ME_KEY, type Me } from '@/entities/session';
import { request, setSession } from '@/shared/api';
import { IS_DEMO } from '@/shared/config';
import * as s from './auth.css';

const ACCOUNTS = { member: 'demo@ieum.app', admin: 'admin@ieum.app' };
// 실제 빌드에 데모 비밀번호가 들어가지 않습니다.
const PASSWORD = import.meta.env.VITE_DEMO_MODE === 'true' ? 'ieum-demo-1234' : '';

interface AuthResponse { user: Me; accessToken: string; refreshToken: string }

/** 가입 없이 바로 둘러볼 수 있게 합니다. 데모 빌드에서만 나타납니다. */
export function DemoLogin() {
  const navigate = useNavigate();
  const client = useQueryClient();
  const login = useMutation({
    mutationFn: (email: string) => request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password: PASSWORD } }),
    onSuccess: async ({ user, accessToken, refreshToken }) => {
      await setSession({ accessToken, refreshToken });
      client.setQueryData(ME_KEY, user);
      await navigate('/', { replace: true });
    },
  });
  if (!IS_DEMO) return null;
  return (
    <section className={s.demo} aria-label="데모 둘러보기">
      <p>포트폴리오용 데모입니다. 서버 없이 이 브라우저 안에서만 동작하고, 입력한 내용은 이 기기에만 저장됩니다. 실제 개인정보는 입력하지 마세요.</p>
      <Button type="primary" block loading={login.isPending} onClick={() => { if (!login.isPending) login.mutate(ACCOUNTS.member); }}>
        데모 계정으로 둘러보기
      </Button>
      <Button block disabled={login.isPending} onClick={() => { if (!login.isPending) login.mutate(ACCOUNTS.admin); }}>
        운영자로 둘러보기
      </Button>
      {login.error && <Alert type="error" title={login.error.message} />}
    </section>
  );
}
