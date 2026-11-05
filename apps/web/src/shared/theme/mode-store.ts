import { useSyncExternalStore } from 'react';
import { callNative, isNativeApp } from '@/shared/bridge';
import type { ThemeMode } from './antd-theme';

const KEY = 'ieum.theme';
const listeners = new Set<() => void>();

function initial(): ThemeMode {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // 저장소를 쓸 수 없으면 시스템 설정을 따릅니다.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

let mode: ThemeMode = initial();

function apply() {
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'dark' ? '#222222' : '#ffffff');
  if (isNativeApp()) void callNative('ui.setTheme', { mode }).catch(() => {});
}

export function initThemeMode(): void {
  apply();
}

export function setThemeMode(next: ThemeMode): void {
  mode = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // 이번 실행에만 적용됩니다.
  }
  apply();
  listeners.forEach((listener) => listener());
}

export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => mode,
  );
}
