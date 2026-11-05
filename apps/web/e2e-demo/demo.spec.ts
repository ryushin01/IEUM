import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function checkA11y(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary}`) }))).toEqual([]);
}

async function enter(page: Page, name = '데모 계정으로 둘러보기') {
  await page.goto('login');
  await page.getByRole('button', { name }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
}

const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

test('서버 없이 동작하고 외부로 요청을 보내지 않는다', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const { origin } = new URL(request.url());
    if (request.url().startsWith('http') && origin !== 'http://localhost:4174') external.push(request.url());
  });
  const failed: string[] = [];
  page.on('response', (response) => { if (response.status() >= 400) failed.push(`${response.status()} ${response.url()}`); });
  await enter(page);
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByRole('article').first().getByRole('img').last()).toBeVisible();
  const broken = await page.evaluate(async () => {
    const images = [...document.images].filter((img) => img.loading !== 'lazy');
    await Promise.all(images.map((img) => img.decode().catch(() => {})));
    return images.filter((img) => img.naturalWidth === 0).map((img) => img.src);
  });
  expect(broken).toEqual([]);
  expect(external).toEqual([]);
  expect(failed).toEqual([]);
  await checkA11y(page);
});

test('하위 경로에서 새로고침해도 유지되고, 변경 내용이 남으며, 초기화할 수 있다', async ({ page }) => {
  await enter(page);
  await expect(page).toHaveURL(/\/IEUM\/?$/);
  await page.goto('posts/new');
  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: '앨범에서 선택' }).click()]);
  await chooser.setFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG_1PX });
  await page.getByLabel('1번째 사진 설명').fill('올린 사진');
  await page.getByLabel('내용').fill('데모에서 쓴 글');
  await page.getByRole('button', { name: '게시하기' }).click();
  const card = page.getByRole('article').filter({ hasText: '데모에서 쓴 글' });
  await expect(card.getByAltText('올린 사진')).toBeVisible();

  // 끝에 /가 없는 주소는 미리보기 서버가 받지 않으므로 /IEUM/에서 새로고침합니다.
  await page.goto('');
  await page.reload();
  await expect(page.getByRole('article').filter({ hasText: '데모에서 쓴 글' })).toBeVisible();

  await page.goto('settings');
  await page.getByRole('button', { name: '데모 데이터 초기화' }).click();
  await expect(page).toHaveURL(/\/IEUM\/login$/);
  await page.getByRole('button', { name: '데모 계정으로 둘러보기' }).click();
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: '데모에서 쓴 글' })).toHaveCount(0);
});

test('DM: 자동 답장이 소켓처럼 도착하고 읽음이 표시된다', async ({ page }) => {
  await enter(page);
  await page.getByRole('link', { name: /메시지/ }).click();
  await expect(page.getByRole('heading', { name: '메시지' })).toBeVisible();
  await page.getByRole('link', { name: /하늘빛/ }).click();
  await page.getByRole('textbox', { name: '메시지' }).fill('안녕하세요!');
  await page.getByRole('button', { name: '보내기' }).click();
  await expect(page.getByRole('log')).toContainText('안녕하세요!');
  await expect(page.getByRole('log')).toContainText('좋아요', { timeout: 5000 });
  await expect(page.getByRole('log')).toContainText('읽음');
});

test('소셜 로그인 흐름을 실제 제공자 없이 보여 준다', async ({ page }) => {
  await page.goto('login');
  await expect(page.getByText('실제 로그인 없이')).toBeVisible();
  await page.waitForTimeout(300);
  await checkA11y(page);
  await page.getByRole('button', { name: '카카오 로그인' }).click();
  await expect(page).toHaveURL(/\/signup\/social$/);
  await page.getByLabel('만 14세 이상입니다.').check();
  await page.getByRole('checkbox', { name: /이용약관과/ }).check();
  await page.getByRole('button', { name: '가입 완료' }).click();
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
  await page.goto('settings');
  await page.getByRole('button', { name: '로그아웃' }).click();
  await page.getByRole('button', { name: '카카오 로그인' }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
});

test('비밀번호 재설정을 메일 없이 시연한다', async ({ page }) => {
  await page.goto('forgot-password');
  await page.getByLabel('이메일').fill('demo@ieum.app');
  await page.getByRole('button', { name: '재설정 메일 받기' }).click();
  await page.getByRole('link', { name: /재설정 화면/ }).click();
  await expect(page).toHaveURL(/\/IEUM\/reset-password$/);
  await page.getByLabel('새 비밀번호', { exact: true }).fill('Ch4nged!pass');
  await page.getByLabel('새 비밀번호 확인').fill('Ch4nged!pass');
  await page.getByRole('button', { name: '비밀번호 변경' }).click();
  await expect(page.getByRole('status')).toContainText('비밀번호를 변경했습니다');
});

test('운영자로 신고를 처리하고, 정지한 사용자의 글이 숨겨진다', async ({ page }) => {
  await enter(page, '운영자로 둘러보기');
  await page.goto('settings');
  await page.getByRole('link', { name: '신고 처리' }).click();
  await expect(page.getByText('24시간 초과')).toBeVisible();
  await page.waitForTimeout(300);
  await checkA11y(page);
  const report = page.getByRole('listitem').filter({ hasText: '게시글 신고 2건' });
  await report.getByRole('button', { name: '사용자 정지' }).click();
  await page.getByRole('dialog').getByRole('button', { name: '정지' }).click();
  await expect(page.getByText('게시글 신고 2건')).toHaveCount(0);
  await page.getByRole('link', { name: '홈', exact: true }).click();
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: '소라_기록' })).toHaveCount(0);
});
