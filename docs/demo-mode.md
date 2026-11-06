# 데모 모드

`VITE_DEMO_MODE=true`로 빌드하면 **서버 없이** 동작합니다. [웹 데모](https://ryushin01.github.io/IEUM/)가 이 방식입니다.

공통 요청 함수(`shared/api/client.ts`)는 실제 모드와 똑같이 `fetch`를 호출하고, [MSW](https://mswjs.io)(Mock Service Worker)가 이 요청을 받아 브라우저 안의 목업(`shared/api/demo/server.ts`)으로 처리합니다. 화면 코드는 실제 모드와 같고, 개발자 도구의 Network 탭에도 요청이 보입니다. 앱의 Flutter 피드와 DM도 브릿지를 거쳐 같은 목업을 씁니다. 목업 코드는 데모 빌드에서만 불러옵니다.

| 파일 | 역할 |
|---|---|
| `shared/api/demo/server.ts` | 목업 API와 데이터 |
| `shared/api/demo/handlers.ts` | MSW 핸들러. 요청을 목업 API로 넘깁니다 |
| `shared/api/demo/browser.ts` | Service Worker 등록. 첫 요청이 준비를 기다립니다 |
| `public/mockServiceWorker.js` | MSW가 만든 파일입니다. 직접 고치지 않고, MSW를 올리면 `pnpm exec msw init public`으로 다시 만듭니다 |

Service Worker를 쓸 수 없는 환경에서는 목업을 직접 호출하므로 데모는 그대로 동작합니다. 앱의 Flutter 화면은 네트워크를 거치지 않고 브리지로 같은 목업을 호출합니다. `public/mockServiceWorker.js`는 실제 모드 빌드에도 복사되지만 등록하지 않으므로 동작하지 않습니다.

## 둘러보기

로그인 화면에서 버튼을 누릅니다.

| 버튼 | 볼 수 있는 내용 |
|---|---|
| 데모 계정으로 둘러보기 | 피드, 게시글 작성·수정·삭제, 댓글, 좋아요, 프로필, 신고, 차단, DM, 다크 모드, 계정 삭제 |
| 운영자로 둘러보기 | 위 내용과 설정 > 신고 처리 (콘텐츠 삭제, 사용자 정지와 해제) |

직접 입력하려면 `demo@ieum.app` 또는 `admin@ieum.app`, 비밀번호 `ieum-demo-1234`를 씁니다.

## 실제 서비스와 다른 점

| 기능 | 데모 | 실제 코드 |
|---|---|---|
| 데이터 | 이 브라우저의 `localStorage`에만 저장. 설정 > 데모 데이터 초기화로 되돌림. 샘플 데이터 버전(`SEED_VERSION`)이 오르면 입력한 내용은 두고 저장 데이터에 없는 샘플 항목을 합침. 이전에 지운 샘플 항목도 이때 한 번 돌아옴 | PostgreSQL |
| DM | 상대가 자동으로 답장하고 읽음 표시 | WebSocket으로 두 사용자가 실시간 대화 (E2E로 검증) |
| 소셜 로그인 | 제공자 화면 없이 가입 흐름만 시연 | 시스템 인증 창과 서버 코드 교환 (가짜 제공자로 검증, 실제 연동 안 함) |
| 비밀번호 재설정 | 메일 대신 화면에 링크 표시 | SMTP 메일 (가짜 메일로 검증, 실제 발송 안 함) |
| 이미지 | 브라우저에서 줄여 data URL로 저장 | 서버에서 메타데이터 제거 후 저장 |
| 인증 | 비밀번호는 SHA-256 해시로 기기에 저장, 토큰은 형식만 흉내 | scrypt, JWT, 일회용 재발급 토큰 |

데모의 보안은 실제 서비스 수준이 아니므로 실제 개인정보를 입력하지 마세요.

## 배포

`main`에 올리면 `.github/workflows/demo.yml`이 GitHub Pages에 배포합니다. 저장소 이름에 맞춰 `/IEUM/` 경로로 빌드하고, 직접 주소로 들어와도 열리도록 `index.html`을 `404.html`로 복사합니다.

```bash
pnpm --filter @ieum/web dev:demo        # 개발 서버
pnpm --filter @ieum/web test:e2e:demo   # 하위 경로 빌드 검사
```

## Android APK 빌드

공개 데모를 불러오는 앱을 빌드합니다. 출시 서명을 쓰려면 `android/key.properties`가 필요합니다. APK는 아직 공개하지 않았습니다.

```bash
cd apps/mobile
flutter build apk --release --split-per-abi --target-platform android-arm64 --dart-define-from-file=config/demo.json
```
