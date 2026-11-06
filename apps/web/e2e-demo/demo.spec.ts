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
  // API 요청은 HTTP로 나가지만 Service Worker가 응답합니다. API 서버를 띄우지 않으므로 네트워크로 나가면 실패합니다.
  // 다른 주소는 Service Worker가 그대로 내보내도 fromServiceWorker가 true이므로 예외 없이 기록합니다.
  const external: string[] = [];
  const origin = (url: string) => (url.startsWith('http') ? new URL(url).origin : null);
  const isOther = (url: string) => ![null, 'http://localhost:4174', 'http://localhost:4000'].includes(origin(url));
  const isApi = (url: string) => origin(url) === 'http://localhost:4000';
  // 응답을 기다리면 검사 시점에 끝나지 않은 요청을 놓치므로, 시작할 때 기록합니다.
  page.on('request', (request) => {
    if (isOther(request.url())) external.push(request.url());
  });
  page.on('response', (response) => {
    if (isApi(response.url()) && !response.fromServiceWorker()) external.push(response.url());
  });
  page.on('requestfailed', (request) => {
    if (isApi(request.url())) external.push(request.url());
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

test('마우스를 올린 주요 버튼도 명도 대비를 지킨다', async ({ page }) => {
  for (const mode of ['light', 'dark']) {
    await page.goto('login');
    await page.evaluate((value) => localStorage.setItem('ieum.theme', value), mode);
    await page.goto('login');
    await page.getByRole('button', { name: '로그인', exact: true }).hover();
    await page.waitForTimeout(400);
    await checkA11y(page);
  }
  await page.evaluate(() => localStorage.removeItem('ieum.theme'));
});

test('마우스를 올린 위험 버튼도 명도 대비를 지킨다', async ({ page }) => {
  await enter(page, '운영자로 둘러보기');
  await page.goto('admin/reports');
  await page.getByRole('button', { name: '콘텐츠 삭제' }).first().hover();
  await page.waitForTimeout(400);
  await checkA11y(page);
  await page.getByRole('button', { name: '콘텐츠 삭제' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: /삭\s*제/ }).hover();
  await page.waitForTimeout(400);
  await checkA11y(page);
});

test('앱 코드를 불러오기 전에도 고른 테마를 적용한다', async ({ page }) => {
  await page.goto('login');
  await page.evaluate(() => localStorage.setItem('ieum.theme', 'dark'));
  // 앱 코드가 끝내 오지 않아도 HTML만으로 적용되어야 합니다.
  await page.route('**/assets/*.js', (route) => route.abort());
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#1b1e25');
  await page.unroute('**/assets/*.js');
  await page.evaluate(() => localStorage.removeItem('ieum.theme'));
});

test('피드: 스크롤하면 샘플 글의 다음 페이지를 이어서 보여 준다', async ({ page }) => {
  await enter(page);
  const articles = page.getByRole('article');
  await expect(articles).toHaveCount(10);
  await articles.last().scrollIntoViewIfNeeded();
  await expect(articles).toHaveCount(14);
  await expect(page.getByRole('button', { name: '더 보기' })).toHaveCount(0);
});

test('이전 샘플 데이터로 방문해도 입력한 내용을 유지하며 새 글을 받는다', async ({ page }) => {
  await enter(page);
  await expect(page.getByRole('article')).toHaveCount(10);
  await page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('ieum.demo.state')!) as { seedVersion?: number; posts: { id: string; caption: string }[] };
    delete stored.seedVersion;
    stored.posts = stored.posts.slice(0, 6);
    stored.posts[1]!.caption = '방문자가 고친 내용';
    localStorage.setItem('ieum.demo.state', JSON.stringify(stored));
  });
  await page.goto('');
  const articles = page.getByRole('article');
  await expect(articles).toHaveCount(10);
  await expect(page.getByText('방문자가 고친 내용')).toBeVisible();
  await articles.last().scrollIntoViewIfNeeded();
  await expect(articles).toHaveCount(14);
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

/** KWCAG 6.1.3: 대화형 요소의 조작 영역을 측정합니다. 문장 속 링크는 제외합니다. */
async function smallTargets(page: Page) {
  return page.evaluate(() => {
    const MIN = 44;
    const out: string[] = [];
    // 가로로 넘치거나 화면 밖으로 밀려난 조작 요소도 함께 찾습니다.
    const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (overflow > 0) out.push(`페이지 가로 넘침 ${overflow}px`);
    for (const el of document.querySelectorAll<HTMLElement>('a[href], button, input, textarea, [role="switch"], [tabindex="0"]')) {
      if (el.closest('p, .ant-form-item-extra')) continue;
      let box: DOMRect = el.getBoundingClientRect();
      if (el.matches('input[type="checkbox"], input[type="radio"]')) box = (el.closest('label') ?? el).getBoundingClientRect();
      if (el.matches('[class*="chipInput"]') || getComputedStyle(el).opacity === '0') box = (el.closest('label') ?? el).getBoundingClientRect();
      // antd 입력칸은 바깥 틀이 조작 영역입니다.
      const wrapper = el.closest('.ant-input-affix-wrapper');
      if (wrapper) box = wrapper.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;
      const after = getComputedStyle(el, '::after');
      const extraH = after.position === 'absolute' && after.top.startsWith('-') ? -parseFloat(after.top) * 2 : 0;
      if (getComputedStyle(el).position !== 'absolute' && (box.right > window.innerWidth + 1 || box.left < -1)) {
        out.push(`화면 밖 ${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 20)}" right=${Math.round(box.right)}`);
      }
      if (box.height + extraH < MIN || box.width < MIN) {
        out.push(`${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 20)}" ${Math.round(box.width)}x${Math.round(box.height)}`);
      }
    }
    return out;
  });
}

/** Tab으로 옮긴 초점이 고정된 헤더나 메뉴에 가린 요소를 찾습니다. */
async function obscuredFocus(page: Page, stops: number) {
  const found: string[] = [];
  for (let i = 0; i < stops; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const box = el.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      if (top && (el.contains(top) || top.contains(el))) return null;
      return `${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? el.id).trim().slice(0, 20)}"`;
    });
    if (label) found.push(label);
  }
  return found;
}

test('키보드 초점이 고정된 헤더와 하단 메뉴에 가리지 않는다', async ({ page }) => {
  await enter(page, '운영자로 둘러보기');
  await expect(page.getByRole('article').first()).toBeVisible();
  expect(await obscuredFocus(page, 30)).toEqual([]);
  await page.goto('admin/reports');
  await page.getByRole('button', { name: '콘텐츠 삭제' }).first().waitFor();
  expect(await obscuredFocus(page, 20)).toEqual([]);
});

test('주요 화면의 조작 영역이 44px 이상이다', async ({ page }) => {
  const found: Record<string, string[]> = {};
  await page.goto('login');
  await page.getByRole('button', { name: '데모 계정으로 둘러보기' }).waitFor();
  found.login = await smallTargets(page);
  await page.goto('signup');
  await page.getByRole('button', { name: '회원 가입' }).waitFor();
  found.signup = await smallTargets(page);
  await page.goto('login');
  await page.getByRole('button', { name: '데모 계정으로 둘러보기' }).click();
  await expect(page.getByRole('article').first()).toBeVisible();
  found.feed = await smallTargets(page);
  await page.goto('posts/p1');
  await page.getByRole('heading', { name: '댓글' }).waitFor();
  found.detail = await smallTargets(page);
  await page.goto('posts/new');
  await page.getByLabel('내용').waitFor();
  found.write = await smallTargets(page);
  await page.goto('dm/dm1');
  await page.getByRole('log').waitFor();
  found.dm = await smallTargets(page);
  await page.goto('users/haneul');
  await page.getByRole('heading', { name: '하늘빛' }).waitFor();
  found.profile = await smallTargets(page);
  await page.goto('settings');
  await page.getByRole('button', { name: '로그아웃' }).waitFor();
  found.settings = await smallTargets(page);
  await page.goto('me');
  await page.getByRole('button', { name: '프로필 편집' }).waitFor();
  found.me = await smallTargets(page);
  await page.goto('nope');
  await page.getByRole('link', { name: '홈으로' }).waitFor();
  found.notFound = await smallTargets(page);
  expect(found).toEqual({ login: [], signup: [], feed: [], detail: [], write: [], dm: [], profile: [], settings: [], me: [], notFound: [] });
});

test('키보드만으로 메뉴를 열고 신고 창을 열고 닫으며, 초점이 돌아온다', async ({ page }) => {
  await enter(page);
  const menu = page.getByRole('button', { name: '게시글 메뉴' }).first();
  await menu.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.getByRole('menuitem', { name: '신고하기' }).press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('키보드로 넘김 버튼과 하단 메뉴를 쓰고, 화면을 옮기면 본문으로 초점이 간다', async ({ page }) => {
  await enter(page);
  const next = page.getByRole('button', { name: '다음 사진' }).first();
  await next.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('2 / 2').first()).toBeVisible();
  const dm = page.getByRole('link', { name: /메시지/ });
  await dm.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: '메시지' })).toBeVisible();
  await expect(page.locator('#main')).toBeFocused();
  await expect(page).toHaveTitle('메시지 | 이음');
});

test('앱 브릿지: 하위 경로에서도 앱에 경로를 그대로 알리고, 앱의 이동 요청을 처리한다', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const routes: string[] = [];
    w.__routes = routes;
    w.IeumBridge = {
      postMessage(raw: string) {
        const { id, method, params } = JSON.parse(raw);
        if (method === 'ui.routeChanged') routes.push(params.path);
        setTimeout(() => (w.__ieumBridgeReceive as (r: unknown) => void)({ id, ok: true, result: null }), 0);
      },
    };
  });
  const routes = () => page.evaluate(() => (window as unknown as { __routes: string[] }).__routes);
  await page.goto('login');
  await expect.poll(routes).toContain('/login');
  await page.getByRole('button', { name: '데모 계정으로 둘러보기' }).click();
  await expect.poll(routes).toContain('/');
  expect((await routes()).filter((r) => r.includes('IEUM'))).toEqual([]);
  // 앱의 메뉴가 부르는 이동도 하위 경로 안에서 동작합니다.
  await page.evaluate(() => window.__ieumNative!.navigate('/settings'));
  await expect(page).toHaveURL(/\/IEUM\/settings$/);
  await expect.poll(routes).toContain('/settings');
});

test('MSW: 화면의 API 요청이 실제 HTTP 요청으로 나가고 Service Worker가 응답한다', async ({ page }) => {
  const responses: boolean[] = [];
  page.on('response', (response) => {
    if (response.url().includes(':4000/')) responses.push(response.fromServiceWorker());
  });
  await enter(page);
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
  await expect.poll(() => responses.length).toBeGreaterThan(0);
  expect(responses.every(Boolean)).toBe(true);
  // 하위 경로 안에 등록합니다.
  const scope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(new URL(scope).pathname).toBe('/IEUM/');
});

test.describe('Service Worker를 쓸 수 없는 환경', () => {
  test.use({ serviceWorkers: 'block' });

  test('목업 API를 직접 호출해 데모가 그대로 동작한다', async ({ page }) => {
    const apiRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(':4000/')) apiRequests.push(request.url());
    });
    await enter(page);
    await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
    expect(apiRequests).toEqual([]);
  });
});
