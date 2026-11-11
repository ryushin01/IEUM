# 시퀀스 다이어그램

IEUM의 주요 흐름입니다. 피드·DM·하단 메뉴는 Flutter 위젯, 나머지 화면은 웹뷰(React)이며 둘은 [브릿지](bridge.md)로 이어집니다.

## 1. 웹뷰의 토큰 만료와 재발급

재발급 토큰은 일회용이라 재발급은 앱에서만 합니다.

```mermaid
sequenceDiagram
    participant 웹 as 웹뷰 화면 (React)
    participant 브릿지 as 브릿지<br/>(IeumBridge / __ieumBridgeReceive)
    participant 앱 as Flutter 앱
    participant 저장소 as Keychain / Keystore
    participant API as API 서버 (Fastify)

    웹->>API: 요청 (Bearer 액세스 토큰)
    API-->>웹: 401
    웹->>브릿지: auth.refresh { staleAccessToken }
    브릿지->>앱: postMessage
    앱->>저장소: 저장된 토큰 읽기
    alt 이미 다른 요청이 재발급함 (저장된 토큰이 더 새것)
        앱-->>웹: 저장된 최신 토큰
    else 재발급 필요
        앱->>API: POST 재발급 (일회용 refresh 토큰)
        alt 성공
            API-->>앱: 새 토큰 쌍
            앱->>저장소: 저장
            앱-->>웹: 새 토큰
        else 만료
            앱-->>웹: null
            앱->>웹: __ieumNative.sessionExpired() → 로그인 화면
        end
    end
    웹->>API: 같은 요청 다시
```

## 2. 게시글 사진 고르기와 올리기

```mermaid
sequenceDiagram
    actor 사용자
    participant 웹 as 글쓰기 화면 (웹뷰)
    participant 앱 as Flutter 앱
    participant 사진 as image_picker
    participant API as API 서버

    사용자->>웹: 사진 추가
    웹->>앱: media.pick { source, maxCount: 5 }
    앱->>사진: 갤러리 또는 카메라
    사진-->>앱: 파일
    앱-->>웹: { fileIds } (취소하면 빈 배열)
    사용자->>웹: 게시
    웹->>앱: media.upload { fileIds, accessToken, uploadUrl }
    앱->>앱: uploadUrl이 설정된 API 출처인지 확인 (아니면 forbidden_host)
    앱->>API: 사진 업로드
    API->>API: sharp로 다시 인코딩해 위치 정보(EXIF GPS) 제거
    alt 401
        API-->>앱: unauthorized
        앱-->>웹: unauthorized
        웹->>웹: auth.refresh 후 media.upload 한 번 재시도
    else
        API-->>앱: 사진 주소
        앱-->>웹: { urls }
        웹->>API: 게시글 저장 (사진 주소 포함)
    end
```

## 3. DM 실시간 수신

보내기는 REST로 하고, 웹소켓은 받기 전용입니다. 토큰이 주소에 남지 않도록 첫 메시지로 인증합니다.

```mermaid
sequenceDiagram
    actor 나
    actor 상대
    participant 앱 as Flutter DM 화면
    participant 소켓 as WebSocketRealtime<br/>(data/realtime.dart)
    participant WS as /ws (api ws.ts, Hub)
    participant API as POST /conversations/:id/messages

    앱->>소켓: 연결
    소켓->>WS: 접속 후 { type: auth, token }
    alt 5초 안에 인증하지 않음 / 토큰 오류
        WS-->>소켓: close 4401
        소켓->>소켓: 토큰 재발급 후 다시 연결
    else
        WS->>WS: Hub에 사용자 소켓 등록
        WS-->>소켓: { type: ready }
        opt 다시 연결된 것
            소켓-->>앱: ReconnectedEvent (놓친 메시지 다시 받기)
        end
    end
    상대->>API: 메시지 보내기 (1~1,000자, 분당 60회)
    API->>API: 대화 참여·차단 여부 확인, 저장
    API->>WS: hub.send(나, message), hub.send(상대, message)
    WS-->>소켓: { type: message }
    소켓-->>앱: 새 메시지 표시
    나->>앱: 대화 읽음
    API->>WS: hub.send(상대, { type: read })
    Note over 소켓,WS: 연결이 끊기면 지수 백오프로 다시 연결, 30초마다 ping
```
