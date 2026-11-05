ALTER TABLE users ADD COLUMN is_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN suspended_at timestamptz;

ALTER TABLE reports ADD COLUMN resolved_action text CHECK (resolved_action IN ('dismiss', 'remove', 'suspend'));
ALTER TABLE reports ADD COLUMN resolved_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE reports ADD COLUMN resolved_at timestamptz;
CREATE INDEX reports_open_idx ON reports(status, created_at);

CREATE TABLE password_reset_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);
CREATE INDEX password_reset_tokens_user_idx ON password_reset_tokens(user_id);

-- 올렸지만 게시하지 않은 이미지를 정리하기 위한 기록입니다.
CREATE TABLE uploads (
  key text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX uploads_created_idx ON uploads(created_at);
