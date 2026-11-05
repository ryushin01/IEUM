import { callNative, isNativeApp, type Tokens } from '@/shared/bridge';

const KEY = 'ieum.tokens';

/** 앱에서는 Keychain/Keystore(브릿지)에, 브라우저 개발 환경에서는 localStorage에 보관합니다. */
export const tokenStore = {
  async load(): Promise<Tokens | null> {
    if (isNativeApp()) return callNative('auth.getTokens');
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  },
  async save(tokens: Tokens): Promise<void> {
    if (isNativeApp()) {
      await callNative('auth.setTokens', tokens);
      return;
    }
    localStorage.setItem(KEY, JSON.stringify(tokens));
  },
  async clear(): Promise<void> {
    if (isNativeApp()) {
      await callNative('auth.clearTokens');
      return;
    }
    localStorage.removeItem(KEY);
  },
};
