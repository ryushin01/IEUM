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
  /** 재발급은 앱이 맡습니다. 웹과 앱이 동시에 하면 일회용 토큰이 충돌합니다. */
  'auth.refresh': { params: { staleAccessToken: string | null }; result: Tokens | null };
  'media.pick': { params: { source: 'gallery' | 'camera'; maxCount: number }; result: { fileIds: string[] } };
  'media.upload': { params: { fileIds: string[]; accessToken: string; uploadUrl: string }; result: { urls: string[] } };
  'media.read': { params: { fileIds: string[] }; result: { dataUrls: string[] } };
  'ui.setTheme': { params: { mode: 'light' | 'dark' }; result: null };
  'ui.haptic': { params: undefined; result: null };
  'ui.ready': { params: undefined; result: null };
  'ui.routeChanged': { params: { path: string }; result: null };
  /** 데모 전용: 앱 화면의 요청을 웹의 목업 API가 처리한 결과입니다. */
  'demo.reply': { params: { requestId: number; status: number; body: unknown }; result: null };
  /** 데모 전용: 목업이 만든 실시간 이벤트를 앱에 전달합니다. */
  'demo.event': { params: { event: unknown }; result: null };
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
