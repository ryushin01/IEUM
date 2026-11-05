import { clearSession } from '@/shared/api';
import { callNative, isNativeApp } from '@/shared/bridge';
import { setThemeMode } from '@/shared/theme';
import { queryClient } from './providers/AppProviders';
import { router } from './router';

declare global {
  interface Window {
    /** Flutter가 웹을 조작할 때 부릅니다. 계약은 docs/bridge.md에 있습니다. */
    __ieumNative?: {
      navigate(path: string): void;
      scrollTop(): void;
      toggleTheme(): void;
      sessionExpired(): void;
      demoRequest(request: { requestId: number; method: string; path: string; body: unknown; token: string | null }): void;
    };
  }
}

const notify = (send: () => Promise<unknown>) => void send().catch(() => {});

/** 앱 안에서 실행될 때만 Flutter 화면과 연결합니다. */
export function installNativeBridge(): void {
  if (!isNativeApp()) return;
  window.__ieumNative = {
    navigate(path) {
      // Flutter 화면에서 바뀐 내용이 있을 수 있어 새로 받습니다.
      void queryClient.invalidateQueries();
      void router.navigate(path);
    },
    scrollTop() {
      window.scrollTo({ top: 0 });
    },
    toggleTheme() {
      setThemeMode(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    },
    sessionExpired() {
      void clearSession().catch(() => {}).finally(() => {
        queryClient.clear();
        void router.navigate('/login', { replace: true });
      });
    },
    demoRequest({ requestId, method, path, body, token }) {
      if (import.meta.env.VITE_DEMO_MODE !== 'true') return;
      void (async () => {
        const { demoFetch } = await import('@/shared/api/demo/server');
        const res = await demoFetch(path, {
          method,
          headers: token ? { authorization: `Bearer ${token}` } : {},
          ...(body === null || body === undefined ? {} : { body: JSON.stringify(body) }),
        });
        const data: unknown = res.status === 204 ? null : await res.json();
        await callNative('demo.reply', { requestId, status: res.status, body: data });
      })().catch(() => {
        notify(() => callNative('demo.reply', { requestId, status: 500, body: { message: '데모 요청을 처리하지 못했습니다.' } }));
      });
    },
  };
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    void import('@/shared/api/demo/server').then(({ subscribeDemoEvents }) => {
      subscribeDemoEvents((event) => notify(() => callNative('demo.event', { event })));
    });
  }
  const report = (path: string) => notify(() => callNative('ui.routeChanged', { path }));
  router.subscribe((state) => report(state.location.pathname));
  report(router.state.location.pathname);
  notify(() => callNative('ui.ready'));
}
