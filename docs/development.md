# 개발 가이드

## 구조

- **앱(Flutter):** 웹뷰를 띄우고 웹이 할 수 없는 일(보안 저장, 사진, 진동, 뒤로 가기)을 맡습니다. 패키지는 최소로 유지합니다.
- **웹(React):** 모든 화면입니다. 앱 심사 없이 고칠 수 있습니다. 브라우저에서도 그대로 동작해 개발과 E2E가 쉽습니다.
- **API(Node.js):** REST와 받기 전용 WebSocket입니다. 메시지 전송은 REST로 하고 소켓은 알림만 받습니다.

### 패키지 선택

GetX가 상태 관리와 의존성 주입을 맡으므로 역할이 겹치는 `provider`는 넣지 않았습니다. `dio`는 네이티브 사진 업로드에 씁니다. 소셜 로그인은 제공자별 SDK 3개 대신 `flutter_web_auth_2` 하나로 처리합니다. `flutter_launcher_icons`, `flutter_native_splash`는 생성 도구라 앱에 포함되지 않습니다.

### 웹뷰 빌드 도구: Vite

Next.js에서 vanilla-extract의 Turbopack 지원은 아직 실험 단계이고, 웹뷰 앱은 로그인 뒤 화면이 대부분이라 SSR의 이점이 적어 Vite를 골랐습니다. 정적 호스팅에 올리며, 모든 경로를 `index.html`로 돌려주도록 설정해야 합니다.

### 스타일

antd를 `@layer` 안에 넣어(`StyleProvider layer`), layer 밖의 vanilla-extract 스타일이 항상 우선합니다. `*.css.ts`는 빌드 시 실행되므로 `@/shared/theme`이 아니라 `@/shared/theme/theme.css`를 가져옵니다.

## 디자인 기준 (sprout)

[sprout](https://github.com/ryushin01/sprout)의 컨셉과 조건을 따릅니다.

| 항목 | 기준 |
|---|---|
| 색 | 라임 `#c4e538`, 빨강 `#e74c3c` 계열, 오류 `#bb2649`, 그레이스케일, 라이트·다크 |
| 글꼴·문구 | Stylish, "나를 담는 공간" → "나와 너를 잇는 공간" |
| 레이아웃 | 모바일 상단 헤더·하단 GNB, 768px 이상 왼쪽 100px 레일, 테마 토글 위치 |
| 제한 | 이미지 5장, 댓글 100자, 관심사 20종 중 3개, 비밀번호 영문·숫자·특수문자 8자 이상 |
| 피드 | 내용 3줄 말줄임, 댓글 모두 보기, 바로 쓰기, 공식 마크, 인기 글 링, 상대 시간 |

### sprout와 다르게 한 부분

| 항목 | sprout | IEUM | 이유 |
|---|---|---|---|
| 라임 위 글자 | 흰색 | `#222` | 명도 대비 1.4:1 → 12:1 이상 (KWCAG 5.4.3) |
| 보조 글자 | `#999` | `#666` | 흰 배경 대비 4.5:1 이상 |
| 상세·작성 | 모달 | 페이지 | 앱의 뒤로 가기와 스크린 리더 흐름 |
| 이미지 넘김 | Swiper | 기본 스크롤 스냅과 버튼 | 번들 축소, 키보드 조작 |
| 로그인 | 카카오만 | 카카오, 네이버, Google, 이메일 | 요구사항 |

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

아이콘을 바꾸려면 `pnpm --filter @ieum/web icons` 뒤에 `apps/mobile`에서 `dart run flutter_launcher_icons`, `dart run flutter_native_splash:create`를 실행합니다.

## 테스트

- API: 메모리 PGlite와 실제 WebSocket으로 검사합니다.
- E2E: 프로덕션 빌드와 실제 API로 흐름, axe, 가로 넘침을 검사합니다. 브릿지는 가짜 채널을 씁니다. `SCREENSHOTS=1`이면 README 화면을 새로 찍습니다.
- 앱: 브릿지 라우터, 이동 정책, 오프라인 화면을 검사합니다. 실제 웹뷰와 플러그인은 기기에서 확인합니다.
