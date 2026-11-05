import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const keyOf = (secret: string) => createHash('sha256').update(secret).digest();

/** 제공자 토큰을 DB에 평문으로 두지 않도록 AES-256-GCM으로 암호화합니다. */
export function sealToken(value: string, secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyOf(secret), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

export function openToken(sealed: string, secret: string): string {
  const [iv, tag, encrypted] = sealed.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', keyOf(secret), iv!);
  decipher.setAuthTag(tag!);
  return Buffer.concat([decipher.update(encrypted!), decipher.final()]).toString('utf8');
}
