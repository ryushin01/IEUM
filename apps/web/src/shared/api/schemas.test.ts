import { describe, expect, it } from 'vitest';
import { parseRealtimeEvent, parseTokens } from './schemas';

describe('parseTokens', () => {
  it('두 토큰이 모두 있어야 세션으로 봅니다', () => {
    expect(parseTokens({ accessToken: 'a', refreshToken: 'r' })).toEqual({ accessToken: 'a', refreshToken: 'r' });
    expect(parseTokens({ accessToken: 'a' })).toBeNull();
    expect(parseTokens({ accessToken: '', refreshToken: 'r' })).toBeNull();
    expect(parseTokens(null)).toBeNull();
    expect(parseTokens('a.b.c')).toBeNull();
  });
});

describe('parseRealtimeEvent', () => {
  it('type이 있는 JSON 객체만 이벤트로 읽고, 나머지 필드는 그대로 둡니다', () => {
    expect(parseRealtimeEvent('{"type":"message","id":"m1"}')).toEqual({ type: 'message', id: 'm1' });
  });

  it('JSON이 아니거나 type이 없으면 건너뜁니다', () => {
    expect(parseRealtimeEvent('not json')).toBeNull();
    expect(parseRealtimeEvent('{"id":1}')).toBeNull();
    expect(parseRealtimeEvent('[]')).toBeNull();
    expect(parseRealtimeEvent(new ArrayBuffer(1))).toBeNull();
  });
});
