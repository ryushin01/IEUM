import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { expect, type Browser, type Page } from '@playwright/test';

export const DEMO = { email: 'demo@ieum.app', password: 'ieum-demo-1234' };
export const ADMIN = { email: 'admin@ieum.app', password: 'ieum-demo-1234' };
export const THIRD = { email: 'sora@ieum.app', password: 'ieum-demo-1234' };
export const PEER = { email: 'haneul@ieum.app', password: 'ieum-demo-1234' };

export async function login(page: Page, user = DEMO) {
  await page.goto('/login');
  await page.getByLabel('이메일').fill(user.email);
  await page.getByLabel('비밀번호').fill(user.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
}

export async function newLoggedInPage(browser: Browser, user = DEMO) {
  const context = await browser.newContext({ baseURL: 'http://localhost:4173', viewport: { width: 412, height: 839 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await login(page, user);
  return page;
}

export async function checkA11y(page: Page) {
  // 색이 바뀌는 도중에 재면 중간색으로 대비를 계산합니다. 무한 반복하는 로딩 표시는 기다리지 않습니다.
  await page.evaluate(() => Promise.all(document.getAnimations()
    .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
    .map((animation) => animation.finished.catch(() => undefined))));
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary}`) }))).toEqual([]);
}

export async function checkNoOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

export const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

/** API가 파일로 남긴 메일에서 재설정 링크의 주소를 찾습니다. */
export function readResetLink(to: string): string | null {
  const dir = '/tmp/ieum-e2e-outbox';
  let names: string[] = [];
  try { names = readdirSync(dir); } catch { return null; }
  for (const name of names) {
    const mail = JSON.parse(readFileSync(join(dir, name), 'utf8')) as { to: string; text: string };
    if (mail.to === to) return /https?:\S+#token=[\w-]+/.exec(mail.text)?.[0] ?? null;
  }
  return null;
}
