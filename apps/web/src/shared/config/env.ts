export const API_URL: string =
  import.meta.env.VITE_API_URL ?? `${location.protocol}//${location.hostname}:4000`;
export const WS_URL = `${API_URL.replace(/^http/, 'ws')}/ws`;
export const SUPPORT_EMAIL: string = import.meta.env.VITE_SUPPORT_EMAIL ?? 'support@example.com';
