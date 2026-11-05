import { expect, it } from 'vitest';
import { timeAgo } from './time';

const now = new Date('2026-11-05T12:00:00+09:00');
it.each([
  ['2026-11-05T11:59:30+09:00', '방금 전'],
  ['2026-11-05T11:30:00+09:00', '30분 전'],
  ['2026-11-05T09:00:00+09:00', '3시간 전'],
  ['2026-11-02T12:00:00+09:00', '3일 전'],
])('%s → %s', (value, expected) => {
  expect(timeAgo(value, now)).toBe(expected);
});
it('일주일이 넘으면 날짜로 표시한다', () => {
  expect(timeAgo('2026-10-01T12:00:00+09:00', now)).toContain('2026');
});
