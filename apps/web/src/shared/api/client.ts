import type { Tokens } from '@/shared/bridge';
import { API_URL } from '@/shared/config/env';
import { tokenStore } from './token-store';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const NETWORK_MESSAGE = '네트워크 연결을 확인해 주세요.';

let tokens: Tokens | null = null;
let refreshing: Promise<boolean> | null = null;
let onExpired: () => void = () => {};

export const onSessionExpired = (handler: () => void) => {
  onExpired = handler;
};
export const hasSession = () => tokens !== null;
export const getRefreshToken = () => tokens?.refreshToken ?? null;

export async function restoreSession(): Promise<boolean> {
  tokens = await tokenStore.load();
  return tokens !== null;
}

export async function setSession(next: Tokens): Promise<void> {
  tokens = next;
  await tokenStore.save(next);
}

export async function clearSession(): Promise<void> {
  tokens = null;
  await tokenStore.clear();
}

async function send(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(0, 'network', NETWORK_MESSAGE);
  }
}

/** 동시에 만료돼도 재발급은 한 번만 합니다. (재발급 토큰은 일회용) */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = tokens?.refreshToken;
    if (!refreshToken) return false;
    const res = await send('/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      // 서버 장애나 한도 초과로 로그아웃시키지 않습니다.
      if (res.status !== 401) throw await toError(res);
      await clearSession();
      onExpired();
      return false;
    }
    await setSession((await res.json()) as Tokens);
    return true;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

async function toError(res: Response): Promise<ApiError> {
  const data = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
  return new ApiError(res.status, data?.code ?? 'unknown', data?.message ?? '일시적인 오류가 발생했습니다.');
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  form?: FormData;
  signal?: AbortSignal;
}

export async function request<T>(path: string, options: Options = {}): Promise<T> {
  const run = () => {
    const headers: Record<string, string> = {};
    if (tokens) headers.authorization = `Bearer ${tokens.accessToken}`;
    if (options.body !== undefined) headers['content-type'] = 'application/json';
    return send(path, {
      method: options.method ?? 'GET',
      headers,
      signal: options.signal,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
    });
  };

  let res = await run();
  const code401 = res.status === 401 && tokens !== null;
  if (code401 && (await refreshSession())) res = await run();
  if (!res.ok) throw await toError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** 소켓 연결과 앱 업로드에 쓸 토큰입니다. */
export const getAccessToken = () => tokens?.accessToken ?? null;
