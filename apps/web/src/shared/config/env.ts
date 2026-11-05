/** 서버 없이 브라우저 안의 목업 API로 동작하는 포트폴리오 데모입니다. docs/demo-mode.md 참고 */
export const IS_DEMO: boolean = import.meta.env.VITE_DEMO_MODE === 'true';
/** 끝에 /가 붙습니다. GitHub Pages에서는 /IEUM/입니다. */
export const BASE_URL: string = import.meta.env.BASE_URL;

export const API_URL: string =
  import.meta.env.VITE_API_URL ?? `${location.protocol}//${location.hostname}:4000`;
export const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws`;
/** 설정하지 않으면 문의 메뉴와 연락처를 표시하지 않습니다. */
export const SUPPORT_EMAIL: string | undefined = import.meta.env.VITE_SUPPORT_EMAIL || undefined;
