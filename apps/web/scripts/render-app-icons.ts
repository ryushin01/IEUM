/** 앱 아이콘과 스플래시 원본을 IEUM 로고로 만듭니다. 실행: pnpm --filter @ieum/web icons */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = fileURLToPath(new URL('../../mobile/assets/icon/', import.meta.url));

/** src/shared/ui/Logo.tsx와 같은 도형입니다. */
const LETTERS = 'M0 0h18v100H0zM34 0h96v16H52v26h71v16H52v26h78v16H34zM146 0h18v60c0 16 13 25 33 25s33-9 33-25V0h18v60c0 26-20 40-51 40s-51-14-51-40zM264 0h25l35 76 35-76h25v100h-18V31l-33 69h-18l-33-69v69h-18z';
const INK = '#111214';
const WHITE = '#ffffff';
const ACCENT = '#4545ff';

function html(size: number, background: string, logoWidth: number) {
  const scale = logoWidth / 425;
  const x = (size - logoWidth) / 2;
  const y = (size - 100 * scale) / 2;
  return `<!doctype html><style>html, body { margin: 0; background: ${background}; }</style>
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <g transform="translate(${x} ${y}) scale(${scale})">
        <path d="${LETTERS}" fill="${WHITE}" /><circle cx="412" cy="87" r="13" fill="${ACCENT}" />
      </g>
    </svg>`;
}

const targets: [string, number, string, number][] = [
  ['icon.png', 1024, INK, 700],
  // 적응형 아이콘: 가운데 66%가 안전 영역이라 로고를 줄입니다.
  ['foreground.png', 1024, 'transparent', 520],
  ['splash.png', 768, 'transparent', 440],
  ['splash_android12.png', 1152, 'transparent', 520],
];

const browser = await chromium.launch();
for (const [name, size, background, logoWidth] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size, background, logoWidth));
  await page.screenshot({ path: join(out, name), omitBackground: background === 'transparent' });
  await page.close();
}
await browser.close();
