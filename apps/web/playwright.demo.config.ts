import { defineConfig, devices } from '@playwright/test';

/** GitHub Pages와 같은 하위 경로로 빌드한 데모를 검사합니다. API 서버는 띄우지 않습니다. */
export default defineConfig({
  testDir: 'e2e-demo',
  workers: 1,
  // CI 장비는 접근성 검사가 느려 시간을 넉넉히 둡니다. 재시도로 실패를 가리지 않습니다.
  timeout: process.env.CI ? 90_000 : 30_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4174/IEUM/',
    ...devices['Pixel 7'],
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  },
  webServer: {
    command: 'VITE_DEMO_MODE=true pnpm exec vite build --base=/IEUM/ --outDir dist-demo && pnpm exec vite preview --base=/IEUM/ --outDir dist-demo --port 4174 --strictPort',
    port: 4174,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
