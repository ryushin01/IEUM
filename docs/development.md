# 개발 가이드

## 구조

- **앱(Flutter):** 피드, DM, 하단 메뉴를 위젯으로 그리고, 웹이 할 수 없는 일(보안 저장, 토큰 재발급, 소켓, 사진, 진동, 뒤로 가기)을 맡습니다. 패키지는 최소로 유지합니다.
- **웹(React):** 로그인, 작성, 상세, 프로필, 설정, 운영자 화면입니다. 앱 심사 없이 고칠 수 있습니다. 브라우저에서는 피드, DM, 메뉴까지 React로 그립니다.
- **API(Node.js):** REST와 받기 전용 WebSocket입니다. 메시지 전송은 REST로 하고 소켓은 알림만 받습니다.

### Flutter 화면과 웹뷰

웹뷰는 항상 살아 있고, 경로가 `/`, `/dm`, `/dm/:id`이면 그 위에 Flutter 화면을 올립니다. 웹이 `ui.routeChanged`로 경로를 알려 주므로 경로가 화면의 기준입니다.

- 저장소(`lib/data/post_repository.dart`)는 `ApiTransport`만 압니다. 실제 앱은 `DioTransport`, 데모는 `DemoTransport`를 씁니다.
- 데모의 데이터는 웹 목업 한 곳에 둡니다. Dart에 목업을 따로 두면 Flutter에서 누른 좋아요와 웹뷰에서 쓴 글이 어긋나기 때문입니다.
- 홈으로 돌아오면 피드를 새로 받고, 웹뷰로 갈 때는 웹 캐시를 무효화합니다.
- 앱의 소켓은 Dart 내장 `WebSocket`으로 Flutter가 맡고, 웹은 앱 안에서 소켓을 열지 않습니다. 데모는 목업 이벤트를 `demo.event`로 받습니다.
- 피드, DM, 메뉴는 브라우저용 React 구현이 함께 남아 있어, 바꿀 때 양쪽을 고칩니다.

### 패키지 선택

GetX가 상태 관리와 의존성 주입을 맡으므로 역할이 겹치는 `provider`는 넣지 않았습니다. `dio`는 네이티브 사진 업로드에 씁니다. 소셜 로그인은 제공자별 SDK 3개 대신 `flutter_web_auth_2` 하나로 처리합니다. `flutter_launcher_icons`, `flutter_native_splash`는 생성 도구라 앱에 포함되지 않습니다.

### 웹뷰 빌드 도구: Vite

Next.js에서 vanilla-extract의 Turbopack 지원은 아직 실험 단계이고, 웹뷰 앱은 로그인 뒤 화면이 대부분이라 SSR의 이점이 적어 Vite를 골랐습니다. 정적 호스팅에 올리며, 모든 경로를 `index.html`로 돌려주도록 설정해야 합니다.

### 스타일

antd를 `@layer` 안에 넣어(`StyleProvider layer`), layer 밖의 vanilla-extract 스타일이 항상 우선합니다. `*.css.ts`는 빌드 시 실행되므로 `@/shared/theme`이 아니라 `@/shared/theme/theme.css`를 가져옵니다.

## 디자인 기준

[닷슬래시대시 앱](https://wwit.design/2023/09/30/dotslashdash/)의 화면을 참고했습니다. 거의 검은 면 하나에 흰 글자를 두고, 머리카락 굵기의 선과 밑줄형 입력칸으로 나누며, 파랑은 한 화면의 강조에만 씁니다. 다크가 기본 테마이고 라이트로 바꿀 수 있습니다. 참고 앱의 로고, 사진, 문구, 타원 사진과 원형 글자는 쓰지 않습니다. 대비가 모자란 비활성 글자와 파랑은 기준에 맞춰 조정했습니다. 토큰은 웹의 `apps/web/src/shared/theme/theme.css.ts`, `antd-theme.ts`와 앱의 `apps/mobile/lib/app/theme.dart`에 있으며, 바꿀 때는 모두 같은 값으로 맞춥니다.

| 항목 | 라이트 | 다크 |
|---|---|---|
| 프라이머리 | `#111214` (글자 `#ffffff`) | `#ffffff` (글자 `#111214`) |
| 강조(글쓰기 버튼, 내 말풍선, 로고 점) | `#1a1aff` (글자 `#ffffff`) | `#4545ff` (글자 `#ffffff`) |
| 면 / 띄운 면 | `#ffffff` / `#ffffff` | `#111214` / `#24262c` |
| 글자 / 보조 글자 | `#111214` / `#62656e` | `#f4f5f7` / `#9a9da6` |

| 항목 | 기준 |
|---|---|
| 글꼴·문구 | Pretendard (웹은 `pretendard`의 동적 서브셋, 앱은 `assets/fonts`). 본문 14px, 터치 기기의 웹 입력칸은 iOS 확대를 막으려고 16px, "나와 너를 잇는 공간" |
| 레이아웃 | 헤더(왼쪽 로고, 오른쪽 테마 스위치와 파랑 글쓰기 버튼), 1px 구분선, 윗선으로 구분한 평평한 하단 메뉴, 768px 이상은 왼쪽 100px 레일 |
| 프로필 링 | 강조 색. 인기 글 작성자에만 표시 |
| 제한 | 이미지 5장, 댓글 100자, 관심사 20종 중 3개, 비밀번호 영문·숫자·특수문자 8자 이상 |
| 피드 | 화면 한 장에 게시글 하나를 세로로 넘김. 사진 위 어두운 막에 작성자, 내용(3줄 말줄임), 좋아요·댓글 수, 오른쪽 세로 줄에 좋아요·댓글 보기·메뉴, 아래에 바로 쓰기(밑줄형 입력칸). 상세 화면은 기존 카드 형태 |
| 프로필 | 내 프로필은 작성 글·좋아요한 글 탭(`GET /posts?liked=true`, 본인 것만), 다른 사용자는 작성 글 |

앱 아이콘과 스플래시 원본은 `pnpm --filter @ieum/web icons`로 만든 뒤, `apps/mobile`에서 `dart run flutter_launcher_icons`와 `dart run flutter_native_splash:create`로 반영합니다.

처음 디자인은 [sprout](https://github.com/ryushin01/sprout)를 기준으로 했으며, 다음 구조는 그대로 이어받았습니다.

| 항목 | sprout | IEUM | 이유 |
|---|---|---|---|
| 상세·작성 | 모달 | 페이지 | 앱의 뒤로 가기와 스크린 리더 흐름 |
| 이미지 넘김 | Swiper | 기본 스크롤 스냅과 버튼 | 번들 축소, 키보드 조작 |
| 로그인 | 카카오만 | 카카오, 네이버, Google, Apple, 이메일 | 요구사항, Apple 4.8 |

## 소셜 로그인

Google이 웹뷰 안 OAuth를 차단하므로, 앱은 시스템 인증 창(ASWebAuthenticationSession, Custom Tabs)을 씁니다.

```text
웹 → API /auth/social/{제공자}/start (PKCE challenge) → 제공자 주소
앱 → 시스템 인증 창 → 제공자 → API /auth/social/{제공자}/callback → com.ryushin01.ieum://auth?code=일회용코드
웹 → API /auth/social/exchange (code, PKCE verifier) → 토큰, 또는 첫 로그인이면 추가 정보 입력(약관, 닉네임)
```

- 제공자 비밀 값은 서버에만 둡니다. 토큰은 주소에 싣지 않으며, 일회용 코드는 시작한 쪽만 쓸 수 있습니다.
- 제공자가 확인한 이메일만 저장합니다. 네이버는 확인 여부를 주지 않아 저장하지 않습니다.
- 이메일이 같아도 기존 계정과 자동으로 합치지 않습니다. (계정 탈취 방지)
- 소셜 계정은 비밀번호가 없어, 계정 삭제 때 `삭제`를 입력해 확인합니다.

각 개발자 콘솔에 Redirect URI로 `{PUBLIC_BASE_URL}/auth/social/{kakao|naver|google}/callback`을 등록하고, 발급받은 값을 API 환경 변수에 넣습니다. Google은 "웹 애플리케이션" 유형 클라이언트, 카카오는 Client Secret을 켜고 닉네임 동의 항목(이메일을 쓰면 이메일도)을 설정합니다. 테스트는 가짜 제공자(`apps/api/src/testing/mock-oauth.ts`)로 합니다.

### Apple

Apple은 웹 방식의 Sign in with Apple을 씁니다. iOS와 Android가 같은 흐름이라 패키지와 entitlement를 더하지 않았습니다.

- Apple Developer에서 App ID에 Sign in with Apple을 켜고, 웹용 **Services ID**(예: `com.ryushin01.ieum.web`)를 만든 뒤 도메인과 Return URL `{PUBLIC_BASE_URL}/auth/social/apple/callback`을 등록합니다. Return URL은 https만 되고 localhost는 안 되므로, 로컬에서 실제 Apple을 시험하려면 터널이 필요합니다.
- Sign in with Apple용 **Key(.p8)** 를 만들어 `APPLE_CLIENT_ID`(Services ID), `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`를 설정합니다. `SOCIAL_TOKEN_KEY`에는 32자 이상의 임의 값을 넣습니다. 이 값을 바꾸면 저장된 토큰을 복호화할 수 없습니다.
- 콜백은 폼 POST입니다. 이름은 처음 동의할 때 한 번만 오며 입력 기본값으로만 씁니다.
- 탈퇴하면 Apple 토큰을 폐기합니다. (Apple 5.1.1(v)) 폐기에 실패해도 삭제는 진행하고 오류 로그를 남기므로, 해당 로그를 모니터링해 처리합니다.

## 운영 기능

- **운영자 지정:** 가입 후 `pnpm --filter @ieum/api admin:grant <이메일>`을 실행합니다. 해제는 뒤에 `--revoke`를 붙입니다. 이메일로 찾으므로 이메일이 있는 계정만 지정할 수 있습니다. 설정 화면에 신고 처리 메뉴가 나타납니다.
- **신고 처리:** `/admin/reports`에서 오래된 순서로 보고 콘텐츠 삭제, 사용자 정지, 문제 없음으로 처리합니다. `REPORT_ALERT_EMAIL`을 설정하면 새 신고를 메일로 알립니다. 정지하면 바로 로그아웃되고 글, 프로필, DM이 숨겨지며, 같은 화면에서 해제합니다.
- **비밀번호 재설정:** 메일 링크는 30분 동안 한 번만 쓸 수 있고, 변경하면 모든 기기가 로그아웃됩니다. 가입 여부가 드러나지 않도록 응답은 항상 같습니다.
- **메일:** 운영에서는 `SMTP_URL`, `MAIL_FROM`이 필수입니다. 개발에서는 보내지 않고 `.data/outbox`에 파일로 남깁니다.
- **이미지:** 서버가 다시 인코딩해 메타데이터를 지우고 WebP(긴 변 2048px)로 저장합니다. `S3_BUCKET`, `S3_PUBLIC_URL`을 설정하면 S3 호환 저장소를 쓰고, 없으면 `UPLOAD_DIR`을 씁니다. 게시글·프로필 삭제 시 함께 지우고, 게시하지 않은 이미지는 24시간 뒤 1시간 간격 작업으로 지웁니다.

## 환경 변수

- API: [`apps/api/.env.example`](../apps/api/.env.example). `DATABASE_URL`이 없으면 PGlite(`.data/db`)를 씁니다. `HOT_LIKE_THRESHOLD`(기본 10)는 인기 글 기준입니다.
- 웹: [`apps/web/.env.example`](../apps/web/.env.example)
- 앱: [`apps/mobile/config/production.example.json`](../apps/mobile/config/production.example.json)

## 앱 실행

```bash
# Android 에뮬레이터는 포트를 연결합니다.
adb reverse tcp:5173 tcp:5173 && adb reverse tcp:4000 tcp:4000
cd apps/mobile && flutter run
```

README의 시연 GIF는 Android 에뮬레이터를 켠 뒤 `pnpm demo:gif`로 다시 만듭니다. 통합 테스트가 끝까지 통과해야 파일을 씁니다.

아이콘을 바꾸려면 `pnpm --filter @ieum/web icons` 뒤에 `apps/mobile`에서 `dart run flutter_launcher_icons`, `dart run flutter_native_splash:create`를 실행합니다.

## 테스트

- API: 메모리 PGlite와 실제 WebSocket으로 검사합니다.
- E2E: 프로덕션 빌드와 실제 API로 흐름, axe, 가로 넘침을 검사합니다. 브릿지는 가짜 채널을 씁니다. 
- 앱: 브릿지 라우터, 이동 정책, 오프라인 화면을 검사합니다. 실제 웹뷰와 플러그인은 `integration_test`를 시뮬레이터나 기기에서 실행해 확인합니다. CI에서는 실행하지 않습니다. Android 에뮬레이터와 iOS 시뮬레이터에서 확인한 내용은 [출시 체크리스트](release.md#기기-점검-출시-빌드)에 있습니다.
