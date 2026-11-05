# 브릿지 계약

웹(`apps/web/src/shared/bridge`)과 앱(`apps/mobile/lib/bridge`) 사이의 약속입니다. 한쪽을 바꾸면 다른 쪽과 이 문서를 함께 고칩니다. 웹은 배포 즉시 바뀌지만 앱은 심사를 거치므로, **이미 출시한 메서드의 의미를 바꾸지 말고 새 메서드를 추가합니다.** 앱이 모르는 메서드는 `unknown_method`로 응답합니다.

```text
웹 → 앱  window.IeumBridge.postMessage(JSON.stringify({ id, method, params }))
앱 → 웹  window.__ieumBridgeReceive({ id, ok: true, result })
         window.__ieumBridgeReceive({ id, ok: false, error: { code, message } })
```

| 메서드 | 입력 | 결과 |
|---|---|---|
| `app.getInfo` | | `{ platform, version, build }` |
| `auth.getTokens` | | `{ accessToken, refreshToken }` 또는 `null` |
| `auth.setTokens` | `{ accessToken, refreshToken }` | `null` |
| `auth.clearTokens` | | `null` |
| `auth.socialLogin` | `{ url }` (허용한 제공자 주소) | `{ callbackUrl }` (`com.ryushin01.ieum://auth?...`) |
| `media.pick` | `{ source: 'gallery' \| 'camera', maxCount }` | `{ fileIds }` (취소하면 빈 배열) |
| `media.upload` | `{ fileIds, accessToken, uploadUrl }` | `{ urls }` |
| `ui.setTheme` | `{ mode: 'light' \| 'dark' }` | `null` |
| `ui.haptic` | | `null` |

| 오류 코드 | 뜻 |
|---|---|
| `permission_denied`, `no_camera`, `pick_failed` | 사진 선택 실패 |
| `unauthorized` | 토큰 만료. 웹이 재발급 후 `media.upload`를 한 번 재시도 |
| `upload_failed`, `file_not_found` | 업로드 실패 |
| `cancelled`, `social_failed` | 소셜 로그인 취소, 인증 창 실패 |
| `forbidden_host` | `uploadUrl`이 설정된 API가 아니거나 `url`이 허용한 제공자가 아님 |
| `invalid_params`, `unknown_method`, `internal` | 요청 오류, 미지원 기능, 내부 오류 |

## 보안

- 앱은 현재 페이지가 `WEB_URL`과 같은 출처일 때만 브릿지 요청을 처리합니다.
- 웹뷰는 `WEB_URL` 출처만 엽니다. `mailto:`와 외부 `https:`는 시스템 앱으로 넘기고, 나머지 스킴은 막습니다.
- 토큰은 `API_URL` 출처로만 전송합니다.
- 시스템 인증 창은 `kauth.kakao.com`, `nid.naver.com`, `accounts.google.com`의 https 주소만 엽니다.
