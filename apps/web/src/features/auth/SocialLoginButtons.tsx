import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'antd';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { request } from '@/shared/api';
import { startSocialLogin, type SocialProvider } from './social';
import * as s from './SocialLoginButtons.css';

const KAKAO = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path fill="#000" d="M12 3C6.48 3 2 6.48 2 10.78c0 2.78 1.86 5.22 4.66 6.6l-.95 3.47c-.08.3.26.54.52.37l4.14-2.74c.53.05 1.07.08 1.63.08 5.52 0 10-3.48 10-7.78S17.52 3 12 3z" />
  </svg>
);
const NAVER = (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path fill="#03c75a" d="M15.6 12.8 8.1 2H2v20h6.4V11.2L15.9 22H22V2h-6.4z" />
  </svg>
);
const GOOGLE = (
  <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const APPLE = (
  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
    <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);

const BUTTONS: Record<SocialProvider, { label: string; icon: ReactNode }> = {
  kakao: { label: '카카오 로그인', icon: KAKAO },
  naver: { label: '네이버 로그인', icon: NAVER },
  google: { label: 'Google 계정으로 로그인', icon: GOOGLE },
  apple: { label: 'Apple로 로그인', icon: APPLE },
};

/** 서버에 키가 설정된 제공자만 표시합니다. */
export function SocialLoginButtons() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const providers = useQuery({
    queryKey: ['social-providers'],
    queryFn: () => request<SocialProvider[]>('/auth/social/providers'),
    staleTime: Infinity,
  });
  const login = useMutation({
    mutationFn: (provider: SocialProvider) => startSocialLogin(provider, client, navigate),
  });
  if (!providers.data?.length) return null;
  return (
    <section className={s.section} aria-label="소셜 로그인">
      <p className={s.divider}>또는</p>
      <ul className={s.list}>
        {providers.data.map((provider) => (
          <li key={provider}>
            <button
              type="button"
              className={s.button[provider]}
              disabled={login.isPending}
              onClick={() => { if (!login.isPending) login.mutate(provider); }}
            >
              {BUTTONS[provider].icon}
              {BUTTONS[provider].label}
            </button>
          </li>
        ))}
      </ul>
      {login.error && <Alert className={s.error} type="error" title={login.error.message} />}
    </section>
  );
}
