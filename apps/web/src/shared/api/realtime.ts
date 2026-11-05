import { WS_URL } from '@/shared/config/env';
import { getAccessToken, refreshSession } from './client';

export interface RealtimeHandlers {
  onEvent(event: unknown): void;
  /** 끊겼다 다시 연결되면 놓친 메시지를 받아 오도록 알립니다. */
  onReconnect(): void;
}

const MAX_DELAY = 30_000;

/** 받기 전용 소켓입니다. 끊기면 지수 백오프로 다시 연결합니다. */
export function connectRealtime(handlers: RealtimeHandlers): () => void {
  // 빌드 때 값이 고정되도록 직접 비교합니다. 실제 빌드에서는 데모 코드가 빠집니다.
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    let stop: (() => void) | undefined;
    let stopped = false;
    void import('./demo/server').then(({ subscribeDemoEvents }) => {
      if (!stopped) stop = subscribeDemoEvents(handlers.onEvent);
    });
    return () => {
      stopped = true;
      stop?.();
    };
  }
  let socket: WebSocket | null = null;
  let attempts = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let connectedBefore = false;

  const schedule = () => {
    if (stopped) return;
    const delay = Math.min(1000 * 2 ** attempts, MAX_DELAY);
    attempts += 1;
    timer = setTimeout(open, delay);
  };

  function open() {
    if (stopped) return;
    const token = getAccessToken();
    if (!token) return;
    socket = new WebSocket(WS_URL);
    socket.onopen = () => socket?.send(JSON.stringify({ type: 'auth', token }));
    socket.onmessage = (e) => {
      const event = JSON.parse(e.data as string) as { type: string };
      if (event.type === 'ready') {
        attempts = 0;
        if (connectedBefore) handlers.onReconnect();
        connectedBefore = true;
        return;
      }
      handlers.onEvent(event);
    };
    socket.onclose = async (e) => {
      socket = null;
      if (stopped) return;
      if (e.code === 4401) {
        const refreshed = await refreshSession().catch(() => true);
        if (!refreshed) return;
      }
      schedule();
    };
  }

  // 앱이 백그라운드에서 돌아오면 기다리지 않고 바로 연결합니다.
  const onVisible = () => {
    if (document.visibilityState === 'visible' && !socket && !stopped) {
      clearTimeout(timer);
      attempts = 0;
      open();
    }
  };
  document.addEventListener('visibilitychange', onVisible);
  open();

  return () => {
    stopped = true;
    clearTimeout(timer);
    document.removeEventListener('visibilitychange', onVisible);
    socket?.close();
  };
}
