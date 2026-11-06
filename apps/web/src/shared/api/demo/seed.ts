import { BASE_URL } from '@/shared/config/env';

export interface DemoUser {
  id: string;
  email: string | null;
  passwordHash: string | null;
  nickname: string;
  bio: string;
  avatarUrl: string | null;
  interests: string[];
  isOfficial: boolean;
  isAdmin: boolean;
  suspendedAt: string | null;
  socialKey?: string;
}
export interface DemoPost {
  id: string;
  authorId: string;
  caption: string;
  images: { url: string; alt: string }[];
  likes: string[];
  createdAt: string;
  updatedAt: string;
}
export interface DemoComment { id: string; postId: string; authorId: string; body: string; createdAt: string }
export interface DemoConversation { id: string; members: [string, string] }
export interface DemoMessage { id: string; conversationId: string; senderId: string; body: string; readAt: string | null; createdAt: string }
export interface DemoReport { id: string; reporterId: string; targetType: string; targetId: string; reason: string; createdAt: string; open: boolean }

export interface DemoState {
  /** 저장 당시의 샘플 데이터 버전입니다. 1은 값이 없던 처음 버전입니다. */
  seedVersion?: number;
  users: DemoUser[];
  posts: DemoPost[];
  comments: DemoComment[];
  blocks: [string, string][];
  conversations: DemoConversation[];
  messages: DemoMessage[];
  reports: DemoReport[];
  resets: Record<string, string>;
}

/** 저장소에 직접 그려 넣은 일러스트입니다. (public/demo) */
const art = (name: string) => `${BASE_URL}demo/${name}.svg`;
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

export const DEMO_PASSWORD = 'ieum-demo-1234';
export const DEMO_ACCOUNTS = { member: 'demo@ieum.app', admin: 'admin@ieum.app' };

const user = (id: string, nickname: string, bio: string, interests: string[], extra: Partial<DemoUser> = {}): DemoUser => ({
  id, email: `${id}@ieum.app`, passwordHash: null, nickname, bio, avatarUrl: null, interests,
  isOfficial: false, isAdmin: false, suspendedAt: null, ...extra,
});

const post = (id: string, authorId: string, minutes: number, caption: string, images: [string, string][], likes: string[]): DemoPost => {
  // 두 값이 같아야 수정되지 않은 글로 표시됩니다.
  const createdAt = minutesAgo(minutes);
  return {
    id, authorId, caption, likes,
    images: images.map(([name, alt]) => ({ url: art(name), alt })),
    createdAt,
    updatedAt: createdAt,
  };
};

/** 샘플 데이터에 항목을 추가하면 올립니다. 이전 방문자의 저장 데이터에 새 항목이 합쳐집니다. */
export const SEED_VERSION = 2;

/** 입력한 내용은 그대로 두고, 저장 데이터에 없는 샘플 항목을 뒤에 붙입니다. 이전에 지운 샘플 항목도 이때 한 번 돌아옵니다. */
export function mergeSeed(stored: DemoState, seed: DemoState): DemoState {
  const missing = <T extends { id: string }>(current: T[], next: T[]) => {
    const ids = new Set(current.map((item) => item.id));
    return [...current, ...next.filter((item) => !ids.has(item.id))];
  };
  return {
    ...stored,
    seedVersion: seed.seedVersion,
    users: missing(stored.users, seed.users),
    posts: missing(stored.posts, seed.posts),
    comments: missing(stored.comments, seed.comments),
    conversations: missing(stored.conversations, seed.conversations),
    messages: missing(stored.messages, seed.messages),
    reports: missing(stored.reports, seed.reports),
  };
}

export function createSeed(passwordHash: string): DemoState {
  const everyone = ['demo', 'haneul', 'sora', 'mint'];
  const users = [
    user('demo', '이음데모', '오늘 하루를 사진으로 잇습니다.', ['trip', 'music']),
    user('haneul', '하늘빛', '산책과 필름 사진', ['camping'], { isOfficial: true }),
    user('sora', '소라_기록', '바다 근처에 살아요.', ['trip', 'cooking', 'fashion']),
    user('mint', '민트초코', '카페 탐방 기록장', ['restaurant', 'tip']),
    user('admin', '이음운영자', '이음 운영 계정입니다.', [], { isAdmin: true }),
  ].map((u) => ({ ...u, passwordHash }));
  return {
    seedVersion: SEED_VERSION,
    users,
    posts: [
      post('p1', 'haneul', 6, '퇴근길 하늘이 유난히 예뻤던 날.\n다들 오늘 하루 어땠나요?', [['sunset', '노을 지는 바다 위로 해가 저무는 그림'], ['city', '불 켜진 건물들이 있는 밤의 도시 그림']], everyone),
      post('p2', 'sora', 70, '아침 바다는 언제 봐도 좋네요. 파도 소리 들으면서 한참 앉아 있었어요.', [['sea', '맑은 하늘 아래 푸른 파도와 작은 등대가 있는 그림']], ['demo', 'haneul', 'mint']),
      post('p3', 'mint', 180, '비 오는 날에는 역시 따뜻한 라테.\n이번 주 동네 카페 기록 남겨 둡니다.', [['coffee', '나무 탁자 위에 김이 오르는 커피잔이 놓인 그림']], ['sora']),
      post('p4', 'haneul', 60 * 20, '주말 캠핑 다녀왔어요. 별이 정말 많았어요.', [['camping', '별이 가득한 밤하늘 아래 모닥불과 텐트가 있는 그림'], ['forest', '안개 낀 숲속으로 난 길 그림'], ['mountain', '해 뜨는 겹겹의 산 그림']], ['demo', 'sora', 'mint']),
      post('p5', 'demo', 60 * 30, '이음에 올리는 첫 기록입니다. 새싹처럼 천천히 자라 볼게요.', [['sprout', '흙에서 돋아난 연둣빛 새싹 그림']], ['haneul', 'sora']),
      post('p6', 'sora', 60 * 50, '길가에 핀 꽃이 예뻐서 한 장.', [['flowers', '언덕에 알록달록한 꽃이 핀 그림']], ['mint']),
      // 한 페이지(10개)를 넘겨 데모에서도 무한 스크롤이 동작하게 합니다.
      post('p7', 'mint', 60 * 70, '골목 끝에서 찾은 작은 카페. 창가 자리가 제일 좋아요.', [['coffee', '나무 탁자 위에 김이 오르는 커피잔이 놓인 그림']], ['sora', 'demo']),
      post('p8', 'sora', 60 * 90, '해 질 무렵 방파제 산책. 바람이 시원했어요.', [['sunset', '노을 지는 바다 위로 해가 저무는 그림']], ['haneul']),
      post('p9', 'mint', 60 * 110, '야근 끝나고 올려다본 도시 불빛.', [['city', '불 켜진 건물들이 있는 밤의 도시 그림']], []),
      post('p10', 'sora', 60 * 130, '안개 낀 숲길을 걸었어요. 소리가 다 잦아드는 기분이에요.', [['forest', '안개 낀 숲속으로 난 길 그림']], ['mint', 'demo']),
      post('p11', 'mint', 60 * 150, '베란다에 심은 씨앗에서 드디어 싹이 났어요!', [['sprout', '흙에서 돋아난 연둣빛 새싹 그림']], ['haneul', 'sora']),
      post('p12', 'sora', 60 * 170, '새벽 등산은 힘들어도 이 풍경 때문에 또 가게 돼요.', [['mountain', '해 뜨는 겹겹의 산 그림']], ['haneul']),
      post('p13', 'mint', 60 * 190, '동네 꽃집 앞을 지나다가 한 장.', [['flowers', '언덕에 알록달록한 꽃이 핀 그림']], ['demo']),
      post('p14', 'sora', 60 * 210, '오랜만에 다시 찾은 바다. 역시 등대는 그 자리에 있네요.', [['sea', '맑은 하늘 아래 푸른 파도와 작은 등대가 있는 그림']], ['mint']),
    ],
    comments: [
      { id: 'c1', postId: 'p1', authorId: 'sora', body: '색이 정말 곱네요!', createdAt: minutesAgo(5) },
      { id: 'c2', postId: 'p1', authorId: 'demo', body: '저도 오늘 같은 하늘 봤어요 :)', createdAt: minutesAgo(3) },
      { id: 'c3', postId: 'p2', authorId: 'haneul', body: '바다 가고 싶어지네요.', createdAt: minutesAgo(50) },
      { id: 'c4', postId: 'p4', authorId: 'mint', body: '캠핑장 어디인지 궁금해요!', createdAt: minutesAgo(60 * 18) },
      { id: 'c5', postId: 'p5', authorId: 'haneul', body: '환영합니다!', createdAt: minutesAgo(60 * 29) },
    ],
    blocks: [],
    conversations: [
      { id: 'dm1', members: ['demo', 'haneul'] },
      { id: 'dm2', members: ['demo', 'sora'] },
    ],
    messages: [
      { id: 'm1', conversationId: 'dm1', senderId: 'haneul', body: '안녕하세요! 사진 잘 보고 있어요 :)', readAt: null, createdAt: minutesAgo(30) },
      { id: 'm2', conversationId: 'dm2', senderId: 'demo', body: '바다 사진 어디서 찍으셨어요?', readAt: minutesAgo(100), createdAt: minutesAgo(120) },
      { id: 'm3', conversationId: 'dm2', senderId: 'sora', body: '강릉이에요. 이른 아침에 가면 한적해요!', readAt: minutesAgo(90), createdAt: minutesAgo(100) },
    ],
    // 운영자 화면에서 바로 처리해 볼 수 있는 신고입니다.
    reports: [
      { id: 'r1', reporterId: 'haneul', targetType: 'post', targetId: 'p6', reason: '스팸·광고', createdAt: minutesAgo(45), open: true },
      { id: 'r2', reporterId: 'demo', targetType: 'post', targetId: 'p6', reason: '기타 정책 위반', createdAt: minutesAgo(30), open: true },
      { id: 'r3', reporterId: 'sora', targetType: 'comment', targetId: 'c4', reason: '괴롭힘·따돌림', createdAt: minutesAgo(26 * 60), open: true },
    ],
    resets: {},
  };
}
