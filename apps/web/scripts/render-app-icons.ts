/** 앱 아이콘과 스플래시 원본을 IEUM 타이포그래피로 만듭니다. 실행: pnpm --filter @ieum/web icons */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const require = createRequire(import.meta.url);
const fontDir = join(dirname(require.resolve('@fontsource/stylish/package.json')), 'files');
const font = readFileSync(join(fontDir, 'stylish-latin-400-normal.woff2')).toString('base64');
const out = fileURLToPath(new URL('../../mobile/assets/icon/', import.meta.url));

const LIME = '#c4e538';
const INK = '#222222';

function html(size: number, background: string, color: string, textSize: number, stroke: number) {
  return `<!doctype html><style>
    @font-face { font-family: Stylish; src: url(data:font/woff2;base64,${font}); }
    html, body { margin: 0; width: ${size}px; height: ${size}px; background: ${background}; }
    body { display: flex; align-items: center; justify-content: center; }
    span { font: ${textSize}px/1 Stylish; letter-spacing: 0.02em; color: ${color}; -webkit-text-stroke: ${stroke}px ${color}; }
  </style><span>IEUM</span>`;
}

const targets: [string, number, string, string, number, number][] = [
  // 아이콘: 라임 배경에 글자만 둡니다.
  ['icon.png', 1024, LIME, INK, 290, 8],
  // 적응형 아이콘: 가운데 66%가 안전 영역이라 글자를 줄입니다.
  ['foreground.png', 1024, 'transparent', INK, 200, 6],
  ['splash.png', 768, 'transparent', INK, 190, 4],
  ['splash_dark.png', 768, 'transparent', '#ffffff', 190, 4],
  ['splash_android12.png', 1152, 'transparent', INK, 190, 4],
  ['splash_android12_dark.png', 1152, 'transparent', '#ffffff', 190, 4],
];

const browser = await chromium.launch();
for (const [name, size, background, color, textSize, stroke] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size, background, color, textSize, stroke));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, name), omitBackground: background === 'transparent' });
  await page.close();
}
await browser.close();
