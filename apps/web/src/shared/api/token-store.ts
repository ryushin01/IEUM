import { callNative, isNativeApp, type Tokens } from '@/shared/bridge';
import { parseTokens } from './schemas';

const KEY = 'ieum.tokens';

/** 앱에서는 Keychain/Keystore(브릿지)에, 브라우저 개발 환경에서는 localStorage에 보관합니다. */
export const tokenStore = {
  async load(): Promise<Tokens | null> {
    if (isNativeApp()) return parseTokens(await callNative('auth.getTokens'));
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const tokens = parseTokens(JSON.parse(raw));
      // 깨진 값이 남아 있으면 지워, 다음에도 `Bearer undefined` 같은 요청을 보내지 않게 합니다.
      if (!tokens) localStorage.removeItem(KEY);
      return tokens;
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
