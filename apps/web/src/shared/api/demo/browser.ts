import { BASE_URL } from '@/shared/config';

let ready: Promise<boolean> | undefined;

async function start(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) return false;
  try {
    const [{ setupWorker }, { handlers }] = await Promise.all([import('msw/browser'), import('./handlers')]);
    await setupWorker(...handlers).start({
      onUnhandledFrame: 'bypass',
      quiet: true,
      // GitHub Pages의 하위 경로(/IEUM/)에서도 동작하도록 빌드 경로를 따릅니다.
      serviceWorker: { url: `${BASE_URL}mockServiceWorker.js`, options: { scope: BASE_URL } },
    });
    return true;
  } catch (error) {
    console.warn('Service Worker를 쓸 수 없어 목업 API를 직접 호출합니다.', error);
    return false;
  }
}

/**
 * 목업 API용 Service Worker를 한 번만 등록합니다. 준비되기 전에 나간 요청은 가로챌 수 없으므로 요청이 기다립니다.
 * 쓸 수 없는 환경(사생활 보호 모드, 일부 웹뷰)이면 false를 돌려줍니다.
 */
export function startMockApi(): Promise<boolean> {
  ready ??= start();
  return ready;
}
