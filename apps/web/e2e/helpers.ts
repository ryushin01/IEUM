import AxeBuilder from '@axe-core/playwright';
import { expect, type Browser, type Page } from '@playwright/test';

export const DEMO = { email: 'demo@ieum.app', password: 'ieum-demo-1234' };
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
