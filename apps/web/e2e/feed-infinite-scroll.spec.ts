import { expect, test } from '@playwright/test';
import { DEMO, login } from './helpers';

const API = 'http://localhost:4100';
const PAGE_SIZE = 10;
/** 다른 실행에서 만든 글과 섞이지 않게 합니다. */
const RUN = `스크롤 확인 ${Date.now()}`;

test('피드: 끝까지 스크롤하면 다음 페이지를 이어서 불러온다', async ({ page, request }) => {
  const session = await request.post(`${API}/auth/login`, { data: DEMO });
  const { accessToken } = await session.json() as { accessToken: string };
  // 시드 글과 합쳐 두 페이지를 넘도록 채웁니다.
  for (let i = 0; i < PAGE_SIZE + 2; i++) {
    const created = await request.post(`${API}/posts`, {
      headers: { authorization: `Bearer ${accessToken}` },
      data: { caption: `${RUN} #${i}`, images: [{ url: `${API}/uploads/seed-1.png` }] },
    });
    expect(created.ok()).toBe(true);
  }

  await login(page);
  const articles = page.getByRole('article');
  const more = page.getByRole('button', { name: '더 보기' });
  await expect(articles).toHaveCount(PAGE_SIZE);

  // 버튼을 누르지 않고 스크롤만 합니다.
  const pages = page.waitForResponse((res) => /\/posts\?.*cursor=/.test(res.url()));
  await articles.last().scrollIntoViewIfNeeded();
  await pages;
  await expect.poll(() => articles.count()).toBeGreaterThan(PAGE_SIZE);

  // 남은 페이지를 모두 받으면 대체 버튼이 사라지고 글이 중복되지 않습니다.
  await expect(async () => {
    await articles.last().scrollIntoViewIfNeeded();
    await expect(more).toHaveCount(0, { timeout: 500 });
  }).toPass();
  const captions = await page.locator('article p').allTextContents();
  const posts = captions.filter((text) => text.startsWith(RUN));
  // 만든 글이 정확히 한 번씩 보여야 합니다. 중복되면 개수가 달라집니다.
  expect(posts.toSorted()).toEqual(Array.from({ length: PAGE_SIZE + 2 }, (_, i) => `${RUN} #${i}`).toSorted());

  // 프로필 격자도 스크롤만으로 이어집니다.
  // 격자가 짧아 화면이 크면 첫 페이지 뒤 바로 이어서 불러옵니다. 스크롤이 필요하도록 화면을 줄입니다.
  await page.setViewportSize({ width: 412, height: 150 });
  await page.goto('/me');
  const grid = page.getByRole('list', { name: /님의 게시글/ }).getByRole('link');
  await expect(grid).toHaveCount(PAGE_SIZE);
  await grid.last().scrollIntoViewIfNeeded();
  await expect.poll(() => grid.count()).toBeGreaterThan(PAGE_SIZE);
});
