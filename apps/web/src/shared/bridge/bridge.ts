/**
 * Flutter 앱과 주고받는 브릿지입니다. 계약은 docs/bridge.md에 정리했습니다.
 *
 * 웹 → 앱: window.IeumBridge.postMessage(JSON.stringify({ id, method, params }))
 * 앱 → 웹: window.__ieumBridgeReceive({ id, ok, result, error })
 */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export interface BridgeMethods {
  'app.getInfo': { params: undefined; result: { platform: 'ios' | 'android'; version: string; build: string } };
  'auth.getTokens': { params: undefined; result: Tokens | null };
  'auth.setTokens': { params: Tokens; result: null };
  'auth.clearTokens': { params: undefined; result: null };
  'auth.socialLogin': { params: { url: string }; result: { callbackUrl: string } };
  'media.pick': { params: { source: 'gallery' | 'camera'; maxCount: number }; result: { fileIds: string[] } };
  'media.upload': { params: { fileIds: string[]; accessToken: string; uploadUrl: string }; result: { urls: string[] } };
  'ui.setTheme': { params: { mode: 'light' | 'dark' }; result: null };
  'ui.haptic': { params: undefined; result: null };
}

export class BridgeError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

interface Reply {
  id: number;
  ok: boolean;
  result?: unknown;
  error?: { code: string; message: string };
}

declare global {
  interface Window {
    IeumBridge?: { postMessage(message: string): void };
    __ieumBridgeReceive?: (reply: Reply) => void;
  }
}

const pending = new Map<number, { resolve: (v: never) => void; reject: (e: Error) => void }>();
let nextId = 1;

export const isNativeApp = () => typeof window !== 'undefined' && !!window.IeumBridge;

function installReceiver() {
  window.__ieumBridgeReceive ??= (reply) => {
    const call = pending.get(reply.id);
    if (!call) return;
    pending.delete(reply.id);
    if (reply.ok) call.resolve(reply.result as never);
    else call.reject(new BridgeError(reply.error?.code ?? 'unknown', reply.error?.message ?? '앱과 통신하지 못했습니다.'));
  };
}

export function callNative<M extends keyof BridgeMethods>(
  method: M,
  ...args: BridgeMethods[M]['params'] extends undefined ? [] : [BridgeMethods[M]['params']]
): Promise<BridgeMethods[M]['result']> {
  const channel = window.IeumBridge;
  if (!channel) return Promise.reject(new BridgeError('not_native', '앱 환경이 아닙니다.'));
  installReceiver();
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: resolve as (v: never) => void, reject });
    channel.postMessage(JSON.stringify({ id, method, params: args[0] ?? null }));
  });
}
