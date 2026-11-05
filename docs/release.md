# 출시 체크리스트

이 프로젝트는 포트폴리오용이라 출시하지 않습니다. 이 문서는 실제로 출시한다면 필요한 일을 정리한 것입니다.

코드에 있는 항목은 [x], 출시 전에 사람이 해야 하거나 아직 없는 항목은 [ ]입니다.

## 출시 전 필수: 아직 없는 기능

- [ ] **소셜 로그인 실제 연동 확인.** 가짜 제공자로만 테스트했습니다. 실제 키로 네 제공자를 iOS와 Android 기기에서 확인해야 합니다. 특히 Android Custom Tabs에서 Apple 폼 POST 뒤 앱 스킴으로 돌아오는지 확인합니다.
- [ ] **카카오·네이버·Google 탈퇴 시 연결 끊기.** Apple 토큰은 폐기하지만 나머지는 앱 데이터만 삭제합니다. 제공자별 정책을 확인해 연결 해제를 넣습니다.
- [ ] **신고 처리 담당자 지정.** 처리 화면은 있습니다. 앱과 약관이 "24시간 이내 검토"를 약속하므로, 담당자를 운영자로 지정하고 `REPORT_ALERT_EMAIL`을 설정해야 합니다. 주말과 휴일에도 볼 사람이 필요합니다.
- [ ] **메일 서비스 연결과 실제 발송 확인.** `SMTP_URL`, `MAIL_FROM`을 설정하고, 발신 도메인의 SPF·DKIM을 등록해 스팸함으로 가지 않는지 확인합니다. 테스트는 가짜 메일로만 했습니다.
- [ ] **이미지 저장소 연결과 실제 업로드 확인.** S3 호환 버킷과 CDN을 만들어 설정합니다. 테스트는 가짜 S3 서버로만 했습니다. 서버 1대라면 `UPLOAD_DIR`로도 동작하지만 디스크 백업이 필요합니다.
- [ ] **실제 PostgreSQL 검증 확인.** CI에서 PostgreSQL 서비스로 API 테스트를 돌립니다. 운영 DB 버전과 맞는지, 백업에서 복구되는지 확인합니다.
- [ ] 금칙어 목록(`BLOCKED_TERMS`)을 운영 정책에 맞게 채우기

서버를 여러 대로 늘리면 DM 소켓 전달(`apps/api/src/hub.ts`)을 Redis pub/sub 등으로 바꿔야 합니다.

## 운영 정보 채우기

- [x] 앱 ID `com.ryushin01.ieum` 확정 (출시 후 변경 불가). 스토어 콘솔에 등록할 때 사용 가능한지 확인
- [ ] 도메인 확정: `WEB_URL`, `API_URL`, `CORS_ORIGINS`, `PUBLIC_BASE_URL`, `APP_WEB_URL`
- [ ] Apple Developer에 Services ID와 Key 등록, 카카오, 네이버, Google 콘솔에 앱 등록, Redirect URI 등록, 검수 신청 ([개발 가이드](development.md#소셜-로그인)). 로그인 버튼 디자인을 제공자별 가이드와 대조
- [ ] `VITE_SUPPORT_EMAIL`을 실제 문의 메일로 변경
- [ ] 개인정보 처리방침에 메일·저장소 위탁 업체 기재
- [ ] [약관과 개인정보 처리방침](../apps/web/src/pages/legal/LegalPages.tsx) 초안에 운영 주체를 넣고 법률 검토

## 운영 배포

- [ ] API: `apps/api/.env.example`의 값을 모두 설정. `JWT_SECRET`은 32자 이상. 메일 설정이 없으면 서버가 시작되지 않습니다
- [ ] 운영자 지정: `pnpm --filter @ieum/api admin:grant <이메일>`
- [ ] 리버스 프록시 뒤에서 실행하고 https·wss를 종료 (`trustProxy`가 켜져 있어, 프록시 없이 공개하면 요청 제한을 우회할 수 있습니다)
- [ ] DB 백업, 업로드 파일 백업, 로그·오류 모니터링
- [ ] 웹: `VITE_API_URL`을 지정해 빌드하고 정적 호스팅. 모든 경로를 `index.html`로 연결, CSP 헤더 설정

## 빌드

```bash
cd apps/mobile
cp config/production.example.json config/production.json   # 값 수정

# Android: 업로드 키를 만들고 android/key.properties를 작성합니다. (예시: key.properties.example)
flutter build appbundle --release --dart-define-from-file=config/production.json

# iOS: Xcode에서 Signing의 Team을 지정합니다.
flutter build ipa --release --dart-define-from-file=config/production.json
```

출시 빌드는 https가 아닌 주소로 시작하지 않고, `key.properties`가 없으면 서명되지 않습니다. 버전은 `pubspec.yaml`의 `version`으로 올립니다.

## 스토어 심사 요건

| 요건 | 상태 |
|---|---|
| 앱 내 계정 삭제 (Apple 5.1.1(v), Google Play) | [x] 설정 > 계정 삭제 |
| 신고, 차단, 필터, 약관 동의, 운영자 조치 (Apple 1.2, Google UGC) | [x] 기능 / [ ] 담당자 지정 |
| 권한 사용 목적 문구 | [x] `Info.plist`. Android는 시스템 사진 선택기를 써서 권한 요청 없음 |
| 암호화 신고 | [x] `ITSAppUsesNonExemptEncryption=false` (https만 사용) |
| 웹뷰 앱 최소 기능 (Apple 4.2) | [x] 네이티브 사진·촬영, 보안 저장, 오프라인 화면, 진동 / [ ] 심사 반려 가능성 있음, 푸시 알림 추가 권장 |
| 소셜 로그인 동등 옵션 (Apple 4.8) | [x] Apple 로그인(이메일 가리기 지원) / [ ] 실제 Apple 연동 확인 |
| Apple 로그인 사용자 탈퇴 시 토큰 폐기 (Apple 5.1.1(v)) | [x] 구현, 가짜 제공자로 검증 / [ ] 실제 Apple 확인 |
| 공개 개인정보 처리방침 URL | [ ] `WEB_URL/privacy` 배포 후 등록 |
| 공개 계정 삭제 안내 URL (Google Play) | [ ] 배포 후 등록 |
| App Store 개인정보 항목, Google 데이터 보안 양식 | [ ] 콘솔에서 작성 |
| 연령 등급 | [ ] 콘솔 설문 작성 (UGC·메시지 있음, 만 14세 이상) |
| 심사용 데모 계정 | [ ] 운영 DB에 계정과 게시글을 넣고 심사 메모에 기재 |
| 스크린샷, 설명, 지원 URL | [ ] 콘솔에서 작성 |

iOS는 현재 iPhone 전용입니다. iPad를 지원하려면 `TARGETED_DEVICE_FAMILY`와 방향 설정을 바꾸고 화면을 점검합니다.

## 기기 점검 (출시 빌드)

Android 에뮬레이터(API 34) 디버그 빌드에서 직접 조작해 확인한 항목은 [x]입니다. iOS와 실제 기기는 아직 확인하지 못했습니다.

- [x] 로그인 유지, 앱 재시작, 로그아웃
- [ ] 토큰 만료 후 재발급
- [x] 시스템 사진 선택기로 선택, Dio 업로드, 저장된 파일에 메타데이터 없음
- [ ] 촬영, 권한 거부, HEIC 사진, 큰 사진
- [x] 키보드가 DM 입력창을 가리지 않음, 실제 소켓 메시지 수신
- [x] 캐시 없는 오프라인 실행의 오프라인 화면, 복구 후 다시 시도
- [ ] 백그라운드 복귀 후 DM 재연결, 노치·홈 인디케이터 여백
- [x] Android 뒤로 가기, 두 번 눌러 종료, 아이콘, 다크 모드 상태 표시줄
- [ ] 스플래시, 적응형 아이콘의 모양별 확인, 출시 빌드
- [ ] VoiceOver, TalkBack으로 주요 흐름 사용
