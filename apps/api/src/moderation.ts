import { badRequest } from './errors.ts';

/**
 * 게시 전 기본 금칙어 필터입니다. (Apple 심사 지침 1.2)
 * 운영 전 실제 금칙어 목록과 정책으로 채워야 합니다.
 */
const BLOCKED_TERMS = (process.env.BLOCKED_TERMS ?? '시발,씨발,병신,개새끼,fuck')
  .split(',')
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

export function assertAllowedText(text: string): void {
  const normalized = text.toLowerCase().replace(/\s+/g, '');
  if (BLOCKED_TERMS.some((term) => normalized.includes(term))) {
    throw badRequest('운영 정책에 어긋나는 표현이 포함되어 있습니다.');
  }
}
