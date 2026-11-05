import type { S3Config } from './storage.ts';

const isProd = process.env.NODE_ENV === 'production';

function required(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (isProd) throw new Error(`환경 변수 ${name}가 필요합니다.`);
  return devFallback;
}

export interface AppleKey {
  teamId: string;
  keyId: string;
  /** Sign in with Apple용 .p8 키 내용(PEM) */
  privateKey: string;
}

export interface SocialCredentials {
  /** Apple은 Services ID입니다. */
  clientId: string;
  clientSecret?: string;
  apple?: AppleKey;
}

export interface Config {
  port: number;
  databaseUrl?: string;
  dataDir?: string;
  jwtSecret: string;
  corsOrigins: string[];
  publicBaseUrl: string;
  uploadDir: string;
  rateLimit: boolean;
  /** 이미지 공개 주소. 끝에 /를 붙이지 않습니다. */
  mediaBaseUrl: string;
  s3?: S3Config;
  /** 운영 메일 발송 */
  smtp?: { url: string; from: string };
  /** 개발·E2E 전용: 메일을 파일로 남깁니다. */
  mailOutboxDir: string;
  /** 새 신고를 알릴 운영자 메일 */
  reportAlertEmail?: string;
  /** 소셜 로그인 후 돌아갈 웹 주소 */
  webUrl: string;
  social: Partial<Record<'kakao' | 'naver' | 'google' | 'apple', SocialCredentials>>;
  /** Apple 재발급 토큰 암호화 키. 바꾸면 저장된 토큰을 폐기할 수 없습니다. */
  socialTokenKey: string;
  /** 테스트 전용 가짜 제공자 주소 */
  socialMockUrl?: string;
}

function socialCredentials(prefix: string): SocialCredentials | undefined {
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
}

function appleCredentials(): SocialCredentials | undefined {
  const { APPLE_CLIENT_ID: clientId, APPLE_TEAM_ID: teamId, APPLE_KEY_ID: keyId, APPLE_PRIVATE_KEY: privateKey } = process.env;
  if (!clientId || !teamId || !keyId || !privateKey) return undefined;
  // 환경 변수에 한 줄로 넣은 PEM의 줄바꿈을 되돌립니다.
  return { clientId, apple: { teamId, keyId, privateKey: privateKey.replace(/\\n/g, '\n') } };
}

function loadS3(): S3Config | undefined {
  const { S3_BUCKET: bucket, S3_REGION: region, S3_ENDPOINT: endpoint } = process.env;
  if (!bucket) return undefined;
  return { bucket, region: region ?? 'auto', endpoint };
}

export function loadConfig(): Config {
  const port = Number(process.env.PORT ?? 4000);
  const s3 = loadS3();
  const publicBaseUrl = required('PUBLIC_BASE_URL', `http://localhost:${port}`);
  // 객체 저장소를 쓰면 공개 주소(CDN)가 꼭 필요합니다.
  if (s3 && !process.env.S3_PUBLIC_URL) throw new Error('S3_BUCKET을 쓰려면 S3_PUBLIC_URL이 필요합니다.');
  const jwtSecret = required('JWT_SECRET', 'local-development-only-secret-do-not-deploy');
  if (isProd && jwtSecret.length < 32) throw new Error('JWT_SECRET은 32자 이상이어야 합니다.');
  return {
    port,
    databaseUrl: process.env.DATABASE_URL,
    dataDir: process.env.PGLITE_DIR ?? '.data/db',
    jwtSecret,
    corsOrigins: required('CORS_ORIGINS', 'http://localhost:5173,http://10.0.2.2:5173').split(','),
    publicBaseUrl,
    mediaBaseUrl: (process.env.S3_PUBLIC_URL ?? `${publicBaseUrl}/uploads`).replace(/\/$/, ''),
    s3,
    smtp: isProd || process.env.SMTP_URL
      ? { url: required('SMTP_URL', ''), from: required('MAIL_FROM', 'no-reply@example.com') }
      : undefined,
    mailOutboxDir: process.env.MAIL_OUTBOX_DIR ?? '.data/outbox',
    reportAlertEmail: process.env.REPORT_ALERT_EMAIL,
    uploadDir: required('UPLOAD_DIR', '.data/uploads'),
    rateLimit: process.env.RATE_LIMIT !== 'off',
    webUrl: required('APP_WEB_URL', 'http://localhost:5173'),
    social: {
      kakao: socialCredentials('KAKAO'),
      naver: socialCredentials('NAVER'),
      google: socialCredentials('GOOGLE'),
      apple: appleCredentials(),
    },
    socialTokenKey: process.env.APPLE_CLIENT_ID
      ? required('SOCIAL_TOKEN_KEY', 'local-development-only-token-key')
      : (process.env.SOCIAL_TOKEN_KEY ?? 'unused'),
    socialMockUrl: isProd ? undefined : process.env.SOCIAL_MOCK_URL,
  };
}
