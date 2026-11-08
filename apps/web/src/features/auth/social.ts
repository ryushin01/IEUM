import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, type NavigateFunction } from 'react-router';
import { ME_KEY, type Me } from '@/entities/session';
import { ApiError, request, setSession } from '@/shared/api';
import { BridgeError, callNative, isNativeApp } from '@/shared/bridge';
import { IS_DEMO } from '@/shared/config';

export type SocialProvider = 'kakao' | 'naver' | 'google' | 'apple';

export interface SocialSignupState {
  signupToken: string;
  provider: SocialProvider;
  nickname: string;
}

type ExchangeResult =
  | { status: 'login'; user: Me; accessToken: string; refreshToken: string }
  | ({ status: 'signup' } & SocialSignupState);

const VERIFIER_KEY = 'ieum.social.verifier';

const base64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function createPkce() {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

const callbackMessage = (error: string | null) =>
  error === 'denied' ? '로그인을 취소했습니다.' : '로그인하지 못했습니다. 다시 시도해 주세요.';

async function finish(code: string, verifier: string, client: QueryClient, navigate: NavigateFunction) {
  const result = await request<ExchangeResult>('/auth/social/exchange', {
    method: 'POST',
    body: { code, codeVerifier: verifier },
  });
  if (result.status === 'login') {
    await setSession({ accessToken: result.accessToken, refreshToken: result.refreshToken });
    client.setQueryData(ME_KEY, result.user);
    await navigate('/', { replace: true });
    return;
  }
  const state: SocialSignupState = { signupToken: result.signupToken, provider: result.provider, nickname: result.nickname };
  await navigate('/signup/social', { replace: true, state });
}

/** 취소하면 조용히 끝냅니다. 그 밖의 실패는 예외로 알립니다. */
export async function startSocialLogin(provider: SocialProvider, client: QueryClient, navigate: NavigateFunction): Promise<void> {
  const { verifier, challenge } = await createPkce();
  // 데모는 실제 제공자 없이 같은 화면 안에서 돌아오므로 앱에서도 인증 창을 열지 않습니다.
  const native = isNativeApp() && !IS_DEMO;
  const { url } = await request<{ url: string }>(`/auth/social/${provider}/start`, {
    method: 'POST',
    body: { client: native ? 'app' : 'web', codeChallenge: challenge },
  });
  if (!native) {
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    window.location.assign(url);
    return;
  }
  // Google이 웹뷰 안 로그인을 막으므로 앱이 시스템 인증 창을 엽니다.
  let callbackUrl: string;
  try {
    ({ callbackUrl } = await callNative('auth.socialLogin', { url }));
  } catch (error) {
    if (error instanceof BridgeError && error.code === 'cancelled') return;
    throw error;
  }
  const params = new URL(callbackUrl).searchParams;
  const code = params.get('code');
  if (!code) {
    if (params.get('error') === 'denied') return;
    throw new Error(callbackMessage(params.get('error')));
  }
  await finish(code, verifier, client, navigate);
}

export function useCompleteSocialCallback(params: URLSearchParams): string | null {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    // 코드는 한 번만 쓸 수 있으므로 StrictMode의 이중 실행을 막습니다.
    if (started.current) return;
    started.current = true;
    const code = params.get('code');
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    sessionStorage.removeItem(VERIFIER_KEY);
    if (!code || !verifier) {
      setError(callbackMessage(params.get('error')));
      return;
    }
    finish(code, verifier, client, navigate).catch((failure: unknown) => {
      setError(failure instanceof ApiError ? failure.message : callbackMessage(null));
    });
  }, [params, client, navigate]);

  return error;
}
