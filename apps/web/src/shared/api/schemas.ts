import { z } from 'zod';
import type { Tokens } from '@/shared/bridge';

/** 서버·앱·저장소에서 받은 토큰. 비어 있거나 모양이 다르면 세션이 없는 것으로 봅니다. */
const TokensSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
});

export function parseTokens(value: unknown): Tokens | null {
  const result = TokensSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** 실시간 연결로 오는 메시지. `type`이 있는 객체만 받습니다. */
const RealtimeEventSchema = z.looseObject({ type: z.string() });

export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

/** 소켓에서 받은 글자를 이벤트로 읽습니다. JSON이 아니거나 모양이 다르면 null */
export function parseRealtimeEvent(data: unknown): RealtimeEvent | null {
  if (typeof data !== 'string') return null;
  try {
    const result = RealtimeEventSchema.safeParse(JSON.parse(data));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
