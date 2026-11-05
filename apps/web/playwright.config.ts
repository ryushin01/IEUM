import { generateKeyPairSync } from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

/** 테스트마다 새로 만드는 Apple 키입니다. 가짜 제공자에만 씁니다. */
const applePrivateKey = generateKeyPairSync('ec', { namedCurve: 'P-256' }).privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

export const MAIL_OUTBOX = '/tmp/ieum-e2e-outbox';

/** 프로덕션 빌드(vite preview)와 메모리 DB API로 실제 화면을 검사합니다. 먼저 pnpm build가 필요합니다. */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  workers: 1,
  // CI 장비는 접근성 검사가 느려 시간을 넉넉히 둡니다. 재시도로 실패를 가리지 않습니다.
  timeout: process.env.CI ? 90_000 : 30_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    ...devices['Pixel 7'],
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: [
    {
      command: 'node src/testing/mock-oauth.ts',
      cwd: '../api',
      port: 4200,
      reuseExistingServer: false,
      env: { PORT: '4200' },
    },
    {
      command: 'node src/index.ts',
      cwd: '../api',
      port: 4100,
      reuseExistingServer: false,
      env: {
        PORT: '4100', SEED: '1', HOT_LIKE_THRESHOLD: '3', RATE_LIMIT: 'off', PGLITE_DIR: 'memory://',
        UPLOAD_DIR: '/tmp/ieum-e2e-uploads', MAIL_OUTBOX_DIR: MAIL_OUTBOX, CORS_ORIGINS: 'http://localhost:4173', PUBLIC_BASE_URL: 'http://localhost:4100',
        APP_WEB_URL: 'http://localhost:4173', SOCIAL_MOCK_URL: 'http://127.0.0.1:4200',
        KAKAO_CLIENT_ID: 'k', KAKAO_CLIENT_SECRET: 's', NAVER_CLIENT_ID: 'n', NAVER_CLIENT_SECRET: 's',
        GOOGLE_CLIENT_ID: 'g', GOOGLE_CLIENT_SECRET: 's',
        APPLE_CLIENT_ID: 'com.ryushin01.ieum.web', APPLE_TEAM_ID: 'TEAM123456', APPLE_KEY_ID: 'KEY1234567',
        APPLE_PRIVATE_KEY: applePrivateKey, SOCIAL_TOKEN_KEY: 'e2e-token-key',
      },
    },
    {
      command: 'VITE_API_URL=http://localhost:4100 pnpm build && pnpm preview',
      port: 4173,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
