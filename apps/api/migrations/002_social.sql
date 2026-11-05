-- 소셜 계정은 비밀번호가 없고, 제공자가 확인한 이메일만 저장합니다.
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE social_accounts (
  provider text NOT NULL CHECK (provider IN ('kakao', 'naver', 'google')),
  provider_user_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX social_accounts_user_idx ON social_accounts(user_id);

CREATE TABLE oauth_states (
  state_hash text PRIMARY KEY,
  provider text NOT NULL,
  client text NOT NULL CHECK (client IN ('app', 'web')),
  code_challenge text NOT NULL,
  expires_at timestamptz NOT NULL
);

-- login: 인증 직후 앱·웹으로 돌려주는 일회용 코드, signup: 추가 정보 입력을 기다리는 가입 토큰
CREATE TABLE social_tickets (
  ticket_hash text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('login', 'signup')),
  provider text NOT NULL,
  provider_user_id text NOT NULL,
  email text,
  nickname text,
  code_challenge text,
  expires_at timestamptz NOT NULL
);
