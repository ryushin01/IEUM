import { expect, test } from '@playwright/test';
import { ADMIN, checkA11y, checkNoOverflow, login, newLoggedInPage, PEER, PNG_1PX, readResetLink, THIRD } from './helpers';

test.describe('비로그인', () => {
  test('로그인하지 않으면 로그인 화면으로 보낸다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await checkA11y(page);
    await checkNoOverflow(page);
  });

  test('잘못된 비밀번호는 안내한다', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('이메일').fill('demo@ieum.app');
    await page.getByLabel('비밀번호').fill('wrong-password');
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('올바르지 않습니다');
  });

  test('약관에 동의해야 가입되고, 약관은 로그인 없이 볼 수 있다', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('이메일').fill(`new${Date.now()}@example.com`);
    await page.getByLabel('닉네임').fill('이음데모');
    await page.getByRole('button', { name: '중복 확인' }).click();
    await expect(page.getByText('이미 사용 중인 닉네임입니다.')).toBeVisible();
    await page.getByLabel('닉네임').fill(`새싹${Date.now() % 100000}`);
    await page.getByRole('button', { name: '중복 확인' }).click();
    await expect(page.getByText('사용할 수 있는 닉네임입니다.')).toBeVisible();
    await page.getByLabel('비밀번호', { exact: true }).fill('nospecial1');
    await page.getByLabel('비밀번호 확인').fill('different');
    await page.getByRole('button', { name: '회원 가입' }).click();
    await expect(page.getByText('영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.')).toBeVisible();
    await expect(page.getByText('같은 비밀번호를 입력해 주세요.')).toBeVisible();
    await page.getByLabel('비밀번호', { exact: true }).fill('Passw0rd!123');
    await page.getByLabel('비밀번호 확인').fill('Passw0rd!123');
    for (const name of ['게임', '여행', '요리']) await page.getByText(name, { exact: true }).click();
    await expect(page.getByRole('checkbox', { name: '음악' })).toBeDisabled();
    await page.getByRole('button', { name: '회원 가입' }).click();
    await expect(page.getByText('약관과 개인정보 처리방침에 동의해 주세요.')).toBeVisible();
    await checkA11y(page);
    await page.getByLabel('만 14세 이상입니다.').check();
    await page.getByRole('checkbox', { name: /이용약관과/ }).check();
    await page.getByRole('button', { name: '회원 가입' }).click();
    await expect(page.getByText('회원 가입이 완료되었습니다.')).toBeVisible();
    await checkA11y(page);
    await page.getByRole('button', { name: '시작하기' }).click();
    await expect(page.getByRole('heading', { name: '피드' })).toBeAttached();

    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: '개인정보 처리방침' })).toBeVisible();
    await checkA11y(page);
  });
});

test.describe('로그인 후', () => {
  test.beforeEach(async ({ page }) => login(page));

  test('피드: 좋아요, 접근성, 넘침, 다크 모드', async ({ page }) => {
    await expect(page.getByRole('article').first()).toBeVisible();
    await checkA11y(page);
    await checkNoOverflow(page);

    const like = page.getByRole('button', { name: /좋아요/ }).first();
    const before = await like.getAttribute('aria-pressed');
    await like.click();
    await expect(like).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');

    await page.getByRole('switch', { name: '다크 모드' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    // 링크 색 전환 애니메이션 도중의 색을 재지 않도록 기다립니다.
    await page.waitForTimeout(500);
    await checkA11y(page);
    await page.getByRole('switch', { name: '다크 모드' }).click();
  });

  test('게시글 작성, 수정, 댓글, 삭제', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page.getByRole('button', { name: '게시하기' })).toBeDisabled();
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: '앨범에서 선택' }).click(),
    ]);
    await chooser.setFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG_1PX });
    await page.getByLabel('1번째 사진 설명').fill('테스트 이미지');
    await page.getByLabel('내용').fill('E2E 게시글');
    await checkA11y(page);
    await page.getByRole('button', { name: '게시하기' }).click();

    const card = page.getByRole('article').filter({ hasText: 'E2E 게시글' });
    await expect(card).toBeVisible();
    await expect(card.getByAltText('테스트 이미지')).toBeVisible();

    await card.getByRole('textbox', { name: '댓글' }).fill('목록에서 쓴 댓글');
    await card.getByRole('button', { name: '게시', exact: true }).click();
    await expect(card.getByText('댓글 1개')).toBeVisible();
    await card.getByRole('link', { name: '댓글 보기' }).click();
    await expect(page.getByText('목록에서 쓴 댓글')).toBeVisible();
    await page.getByRole('textbox', { name: '댓글' }).fill('첫 댓글');
    await page.getByRole('button', { name: '게시', exact: true }).click();
    await expect(page.getByText('첫 댓글')).toBeVisible();
    await checkA11y(page);

    await page.getByRole('button', { name: '게시글 메뉴' }).click();
    await page.getByRole('menuitem', { name: '수정하기' }).click();
    await page.getByLabel('내용').fill('수정한 게시글');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('수정한 게시글')).toBeVisible();
    await expect(page.getByText('수정됨')).toBeVisible();

    await page.getByRole('button', { name: '게시글 메뉴' }).click();
    await page.getByRole('menuitem', { name: '삭제하기' }).click();
    await page.getByRole('button', { name: '삭제' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText('수정한 게시글')).toHaveCount(0);
  });

  test('공식 마크, 인기 링, 맨 위로, 잘못된 주소', async ({ page }) => {
    const official = page.getByRole('article').filter({ hasText: '공식 계정' }).first();
    await expect(official).toContainText('하늘빛');
    // 첫 글은 앞선 테스트의 좋아요 변경 영향을 받으므로 다른 글로 확인합니다.
    await expect(page.getByRole('article').filter({ hasText: '소라_기록' })).toContainText('인기 게시글');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.getByRole('button', { name: '맨 위로' }).click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await page.goto('/없는-주소');
    await expect(page.getByRole('heading', { name: '페이지를 찾을 수 없습니다' })).toBeVisible();
    await checkA11y(page);
  });

  test('이미지는 5장까지 올린다', async ({ page }) => {
    await page.goto('/posts/new');
    await expect(page.getByText('사진 0 / 5장')).toBeVisible();
  });

  test('다른 사용자 글 신고', async ({ page }) => {
    const card = page.getByRole('article').filter({ hasText: '하늘' }).first();
    await card.getByRole('button', { name: '게시글 메뉴' }).click();
    await page.getByRole('menuitem', { name: '신고하기' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: '신고' })).toBeDisabled();
    await dialog.getByRole('radio', { name: '스팸·광고' }).check();
    await expect(page.getByRole('menu')).toBeHidden();
    await checkA11y(page);
    await dialog.getByRole('button', { name: '신고' }).click();
    await expect(page.getByText('신고가 접수되었습니다')).toBeVisible();
  });

  test('내 정보, 프로필 수정, 설정 화면', async ({ page }) => {
    await page.getByRole('link', { name: '내 정보' }).click();
    await expect(page.getByRole('heading', { name: '이음데모' })).toBeVisible();
    await checkA11y(page);
    await page.getByRole('button', { name: '프로필 편집' }).click();
    await page.getByLabel('소개').fill('E2E로 바꾼 소개');
    await page.getByRole('button', { name: '저장' }).click();
    await expect(page.getByText('E2E로 바꾼 소개')).toBeVisible();
    await page.getByRole('button', { name: '설정' }).click();
    await expect(page.getByRole('button', { name: '계정 삭제' })).toBeVisible();
    await checkA11y(page);
    await checkNoOverflow(page);
  });

  test('키보드: 건너뛰기 링크로 본문에 이동한다', async ({ page }) => {
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: '본문 바로가기' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});

test('DM: 두 사용자가 소켓으로 실시간 대화한다', async ({ browser }) => {
  const demo = await newLoggedInPage(browser);
  const peer = await newLoggedInPage(browser, PEER);

  await demo.goto('/dm');
  await expect(demo.getByRole('heading', { name: '메시지' })).toBeVisible();
  await checkA11y(demo);
  await demo.getByRole('link', { name: /하늘빛/ }).click();
  await expect(demo.getByRole('log')).toContainText('사진 잘 보고 있어요');
  await checkA11y(demo);

  await peer.goto('/dm');
  await peer.getByRole('link', { name: /이음데모/ }).click();
  await expect(peer.getByRole('log')).toBeVisible();

  await demo.waitForTimeout(500); // 소켓 인증 대기
  await peer.getByLabel('메시지', { exact: true }).last().fill('실시간으로 도착하나요?');
  await peer.getByRole('button', { name: '보내기' }).click();
  await expect(demo.getByRole('log')).toContainText('실시간으로 도착하나요?');

  await demo.getByRole('textbox', { name: '메시지' }).fill('네, 도착했어요!');
  await demo.getByRole('button', { name: '보내기' }).click();
  await expect(peer.getByRole('log')).toContainText('네, 도착했어요!');
  await checkNoOverflow(demo);
  await demo.context().close();
  await peer.context().close();
});

test('차단하면 피드에서 사라진다', async ({ browser }) => {
  const page = await newLoggedInPage(browser);
  await page.goto('/');
  const card = page.getByRole('article').filter({ hasText: '소라_기록' }).first();
  await card.getByRole('link', { name: /소라_기록/ }).click();
  await page.getByRole('button', { name: '사용자 메뉴' }).click();
  await page.getByRole('menuitem', { name: '차단하기' }).click();
  await expect(page.getByRole('button', { name: '차단', exact: true })).toBeVisible();
  await expect(page.getByRole('menu')).toBeHidden();
  await page.waitForTimeout(500);
  await checkA11y(page); // 빨간 위험 버튼의 대비도 확인합니다.
  await page.getByRole('button', { name: '차단', exact: true }).click();
  await expect(page.getByRole('button', { name: '차단 해제' })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: '소라_기록' })).toHaveCount(0);
  await page.goto('/settings/blocks');
  await page.getByRole('button', { name: '소라_기록 님 차단 해제' }).click();
  await expect(page.getByText('차단한 사용자가 없습니다.')).toBeVisible();
  await page.context().close();
});

test('계정을 삭제하면 다시 로그인할 수 없다', async ({ page }) => {
  const email = `leave${Date.now()}@example.com`;
  await page.goto('/signup');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('닉네임').fill(`탈퇴${Date.now() % 100000}`);
  await page.getByLabel('비밀번호', { exact: true }).fill('Passw0rd!123');
  await page.getByLabel('비밀번호 확인').fill('Passw0rd!123');
  await page.getByLabel('만 14세 이상입니다.').check();
  await page.getByRole('checkbox', { name: /이용약관과/ }).check();
  await page.getByRole('button', { name: '회원 가입' }).click();
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
  await page.goto('/settings');
  await page.getByRole('button', { name: '계정 삭제' }).click();
  await page.getByLabel('비밀번호 확인').fill('Passw0rd!123');
  await page.waitForTimeout(500); // 버튼이 활성화되는 전환이 끝난 색을 잽니다.
  await checkA11y(page);
  await page.getByRole('button', { name: '영구 삭제' }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('비밀번호').fill('Passw0rd!123');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('올바르지 않습니다');
});

test('앱 브릿지: 토큰은 앱 저장소에, 이미지는 앱 업로드로 처리한다', async ({ page }) => {
  // Flutter의 JavaScript 채널을 흉내 냅니다. 실제 채널은 flutter 테스트와 기기에서 검증합니다.
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const calls: { method: string; params: unknown }[] = [];
    w.__nativeCalls = calls;
    let tokens: unknown = null;
    w.IeumBridge = {
      postMessage(raw: string) {
        const { id, method, params } = JSON.parse(raw);
        calls.push({ method, params });
        let result: unknown = null;
        if (method === 'auth.getTokens') result = tokens;
        if (method === 'auth.setTokens') tokens = params;
        if (method === 'auth.clearTokens') tokens = null;
        if (method === 'media.pick') result = { fileIds: ['f1'] };
        if (method === 'media.upload') result = { urls: ['http://localhost:4100/uploads/seed-1.png'] };
        if (method === 'app.getInfo') result = { platform: 'ios', version: '1.0.0', build: '1' };
        setTimeout(() => (w.__ieumBridgeReceive as (r: unknown) => void)({ id, ok: true, result }), 0);
      },
    };
  });
  await page.goto('/login');
  await page.getByLabel('이메일').fill('demo@ieum.app');
  await page.getByLabel('비밀번호').fill('ieum-demo-1234');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  const stored = await page.evaluate(() => localStorage.getItem('ieum.tokens'));
  expect(stored).toBeNull();
  // 앱에서는 Flutter가 피드와 하단 메뉴를 그리므로 웹은 그리지 않습니다.
  await expect(page.getByRole('navigation', { name: '주 메뉴' })).toHaveCount(0);
  await expect(page.getByRole('article')).toHaveCount(0);
  // Flutter 메뉴가 부르는 방식으로 이동합니다.
  await page.evaluate(() => window.__ieumNative!.navigate('/posts/new'));
  await page.getByRole('button', { name: '촬영' }).click();
  await expect(page.getByLabel('1번째 사진 설명')).toBeVisible();
  const methods = await page.evaluate(() =>
    ((window as unknown as { __nativeCalls: { method: string }[] }).__nativeCalls).map((c) => c.method));
  expect(methods).toEqual(expect.arrayContaining(['auth.getTokens', 'media.pick', 'media.upload', 'ui.ready', 'ui.routeChanged']));
  const routes = await page.evaluate(() =>
    ((window as unknown as { __nativeCalls: { method: string; params: { path: string } }[] }).__nativeCalls)
      .filter((c) => c.method === 'ui.routeChanged').map((c) => c.params.path));
  expect(routes).toEqual(expect.arrayContaining(['/login', '/', '/posts/new']));
});

test.describe('소셜 로그인 (가짜 제공자)', () => {
  test('첫 로그인은 추가 정보 입력 후 가입되고, 다음에는 바로 로그인되며, 문구로 삭제한다', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('button', { name: '네이버 로그인' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Google 계정으로 로그인' })).toBeVisible();
    await checkA11y(page);

    await page.getByRole('button', { name: '카카오 로그인' }).click();
    await expect(page).toHaveURL(/\/signup\/social$/);
    // 제공자 닉네임에서 공백을 뺀 값을 기본값으로 넣습니다.
    await expect(page.getByLabel('닉네임')).toHaveValue('카카오사용자');
    await page.getByRole('button', { name: '가입 완료' }).click();
    await expect(page.getByText('약관과 개인정보 처리방침에 동의해 주세요.')).toBeVisible();
    await page.waitForTimeout(500); // 오류 문구가 나타나는 애니메이션이 끝난 색을 잽니다.
    await checkA11y(page);
    await page.getByLabel('만 14세 이상입니다.').check();
    await page.getByRole('checkbox', { name: /이용약관과/ }).check();
    await page.getByRole('button', { name: '가입 완료' }).click();
    await page.getByRole('button', { name: '시작하기' }).click();
    await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();

    await page.goto('/settings');
    await page.getByRole('button', { name: '로그아웃' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.getByRole('button', { name: '카카오 로그인' }).click();
    await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();

    await page.goto('/settings');
    await page.getByRole('button', { name: '계정 삭제' }).click();
    await expect(page.getByRole('button', { name: '영구 삭제' })).toBeDisabled();
    await page.getByLabel(/삭제.*입력/).fill('삭제');
    await page.getByRole('button', { name: '영구 삭제' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('Apple: 폼 콜백으로 돌아와 이름을 기본값으로 넣고, 다크 모드 버튼도 대비를 지킨다', async ({ page }) => {
    // 저장된 설정으로 시작해 antd와 화면 스타일이 함께 다크 모드가 되게 합니다.
    await page.addInitScript(() => localStorage.setItem('ieum.theme', 'dark'));
    await page.goto('/login');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.waitForTimeout(400);
    await checkA11y(page);
    await page.getByRole('button', { name: 'Apple로 로그인' }).click();
    await expect(page).toHaveURL(/\/signup\/social$/);
    await expect(page.getByLabel('닉네임')).toHaveValue('김사과');
    await page.getByLabel('만 14세 이상입니다.').check();
    await page.getByRole('checkbox', { name: /이용약관과/ }).check();
    await page.getByRole('button', { name: '가입 완료' }).click();
    await page.getByRole('button', { name: '시작하기' }).click();
    await expect(page.getByRole('navigation', { name: '주 메뉴' })).toBeVisible();
    await page.goto('/settings');
    await page.getByRole('button', { name: '계정 삭제' }).click();
    await page.getByLabel(/삭제.*입력/).fill('삭제');
    await page.getByRole('button', { name: '영구 삭제' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('이미 가입된 이메일은 합치지 않고 안내한다', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Google 계정으로 로그인' }).click();
    await expect(page.getByRole('alert')).toContainText('이미 가입된 이메일입니다');
    await checkA11y(page);
    await expect(page.getByRole('link', { name: '로그인으로 돌아가기' })).toBeVisible();
  });
});

test('앱 브릿지: 소셜 로그인은 시스템 인증 창 결과로 처리한다', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.IeumBridge = {
      async postMessage(raw: string) {
        const { id, method, params } = JSON.parse(raw);
        let result: unknown = null;
        if (method === 'auth.socialLogin') {
          // 시스템 인증 창 대신 제공자와 API를 거쳐 앱 스킴 주소를 얻습니다.
          const authorize = new URL(params.url);
          const callback = new URL(authorize.searchParams.get('redirect_uri')!);
          callback.searchParams.set('state', authorize.searchParams.get('state')!);
          callback.searchParams.set('code', 'code-naver');
          w.__socialCallback = callback.toString();
          result = { callbackUrl: 'com.ryushin01.ieum://auth?error=denied' };
        }
        (w.__ieumBridgeReceive as (r: unknown) => void)({ id, ok: true, result });
      },
    };
  });
  await page.goto('/login');
  await page.getByRole('button', { name: '네이버 로그인' }).click();
  // 사용자가 취소한 경우입니다. 오류 없이 로그인 화면에 머뭅니다.
  await expect.poll(() => page.evaluate(() => (window as unknown as Record<string, unknown>).__socialCallback)).toContain('/auth/social/naver/callback');
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('비밀번호 재설정: 메일 링크로 바꾸고, 토큰을 주소에 남기지 않는다', async ({ page }) => {
  const email = `reset${Date.now()}@example.com`;
  await page.goto('/signup');
  await page.getByLabel('이메일').fill(email);
  await page.getByLabel('닉네임').fill(`재설정${Date.now() % 100000}`);
  await page.getByLabel('비밀번호', { exact: true }).fill('Passw0rd!123');
  await page.getByLabel('비밀번호 확인').fill('Passw0rd!123');
  await page.getByLabel('만 14세 이상입니다.').check();
  await page.getByRole('checkbox', { name: /이용약관과/ }).check();
  await page.getByRole('button', { name: '회원 가입' }).click();
  await page.getByRole('button', { name: '시작하기' }).click();
  await page.goto('/settings');
  await page.getByRole('button', { name: '로그아웃' }).click();

  await page.getByRole('link', { name: '비밀번호를 잊으셨나요?' }).click();
  // 로그인 화면에도 같은 이름의 칸이 있으므로 화면이 바뀐 뒤 입력합니다.
  await expect(page.getByRole('heading', { name: '비밀번호 찾기' })).toBeVisible();
  await page.getByLabel('이메일').fill(email);
  await checkA11y(page);
  await page.getByRole('button', { name: '재설정 메일 받기' }).click();
  await expect(page.getByRole('status')).toContainText('재설정 메일을 보냈습니다');

  await expect.poll(() => readResetLink(email)).not.toBeNull();
  // E2E는 미리보기 서버 주소에서 엽니다.
  const link = new URL(readResetLink(email)!);
  await page.goto(`${link.pathname}${link.hash}`);
  await expect(page).toHaveURL(/\/reset-password$/);
  await checkA11y(page);
  await page.getByLabel('새 비밀번호', { exact: true }).fill('Ch4nged!pass');
  await page.getByLabel('새 비밀번호 확인').fill('Ch4nged!pass');
  await page.getByRole('button', { name: '비밀번호 변경' }).click();
  await expect(page.getByRole('status')).toContainText('비밀번호를 변경했습니다');

  await login(page, { email, password: 'Ch4nged!pass' });

  // 링크 없이 열면 안내합니다.
  await page.goto('/reset-password');
  await expect(page.getByRole('alert')).toContainText('링크가 올바르지 않습니다');
});

test('운영자: 신고를 보고 정지·해제하며, 일반 사용자는 들어올 수 없다', async ({ browser, page }) => {
  // 일반 사용자는 신고 화면으로 들어갈 수 없습니다.
  await login(page, PEER);
  await page.goto('/admin/reports');
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: '신고 처리' })).toHaveCount(0);

  // 신고합니다.
  await page.goto('/');
  const card = page.getByRole('article').filter({ hasText: '소라_기록' });
  await card.getByRole('button', { name: '게시글 메뉴' }).click();
  await page.getByRole('menuitem', { name: '신고하기' }).click();
  await page.getByRole('radio', { name: '음란·불쾌한 콘텐츠' }).check();
  await page.getByRole('dialog').getByRole('button', { name: '신고' }).click();
  await expect(page.getByText('신고가 접수되었습니다')).toBeVisible();

  const admin = await newLoggedInPage(browser, ADMIN);
  await admin.goto('/settings');
  await admin.getByRole('link', { name: '신고 처리' }).click();
  const report = admin.getByRole('listitem').filter({ hasText: '음란·불쾌한 콘텐츠' });
  await expect(report).toContainText('소라_기록');
  await admin.waitForTimeout(400);
  await checkA11y(admin);
  await checkNoOverflow(admin);
  await report.getByRole('button', { name: '사용자 정지' }).click();
  await admin.getByRole('dialog').getByRole('button', { name: '정지' }).click();
  await expect(report).toHaveCount(0);
  await expect(admin.getByRole('button', { name: '소라_기록 님 정지 해제' })).toBeVisible();

  // 정지된 사용자의 글은 숨겨지고 로그인은 거부됩니다.
  await page.goto('/');
  await expect(page.getByRole('article').first()).toBeVisible();
  await expect(page.getByRole('article').filter({ hasText: '소라_기록' })).toHaveCount(0);
  const context = await browser.newContext({ baseURL: 'http://localhost:4173' });
  const banned = await context.newPage();
  await banned.goto('/login');
  await banned.getByLabel('이메일').fill(THIRD.email);
  await banned.getByLabel('비밀번호').fill(THIRD.password);
  await banned.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(banned.getByRole('alert')).toContainText('이용이 제한된 계정');

  await admin.getByRole('button', { name: '소라_기록 님 정지 해제' }).click();
  await expect(admin.getByRole('button', { name: '소라_기록 님 정지 해제' })).toHaveCount(0);
  await login(banned, THIRD);
  await context.close();
  await admin.context().close();
});
