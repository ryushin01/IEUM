ALTER TABLE social_accounts DROP CONSTRAINT social_accounts_provider_check;
ALTER TABLE social_accounts ADD CONSTRAINT social_accounts_provider_check CHECK (provider IN ('kakao', 'naver', 'google', 'apple'));
-- 계정 삭제 때 폐기해야 하는 Apple 재발급 토큰입니다. 암호화해 저장합니다.
ALTER TABLE social_accounts ADD COLUMN provider_token text;
ALTER TABLE social_tickets ADD COLUMN provider_token text;
