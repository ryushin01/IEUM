/** 앱 아이콘과 스플래시 원본을 무한대 아이콘(Fluent Emoji Flat, MIT)으로 만듭니다. 실행: pnpm --filter @ieum/web icons */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const out = fileURLToPath(new URL('../../mobile/assets/icon/', import.meta.url));

/** scripts/brand/infinity.svg(32×32 판, 파비콘과 같은 그림)의 도형입니다. */
const source = readFileSync(new URL('./brand/infinity.svg', import.meta.url), 'utf8');
const SHAPE = source.slice(source.indexOf('>') + 1, source.lastIndexOf('</svg>'));
const INK = '#111214';

/** 32×32 판을 width 크기로 키워 가운데 둡니다. 무한대는 가로로 길어, 안전 영역은 모서리까지 재서 크기를 정했습니다. */
function html(size: number, background: string, width: number) {
  const scale = width / 32;
  const offset = (size - width) / 2;
  return `<!doctype html><style>html, body { margin: 0; background: ${background}; }</style>
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <g transform="translate(${offset} ${offset}) scale(${scale})">${SHAPE}</g>
    </svg>`;
}

const targets: [string, number, string, number][] = [
  ['icon.png', 1024, INK, 840],
  // 적응형 아이콘: 가운데 66%가 안전 영역이라 무한대의 양 끝이 그 원 안에 들도록 줄입니다.
  ['foreground.png', 1024, 'transparent', 640],
  ['splash.png', 768, 'transparent', 480],
  ['splash_android12.png', 1152, 'transparent', 600],
];

const browser = await chromium.launch();
for (const [name, size, background, width] of targets) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size, background, width));
  await page.screenshot({ path: join(out, name), omitBackground: background === 'transparent' });
  await page.close();
}
await browser.close();
