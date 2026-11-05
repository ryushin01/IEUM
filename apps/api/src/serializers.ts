import { badRequest } from './errors.ts';

/** 웹의 shared/config/interests.ts와 같은 목록입니다. */
export const INTERESTS = [
  'game', 'movie', 'restaurant', 'music', 'mbti', 'celebrity', 'date', 'job', 'alcohol', 'car',
  'fashion', 'interior', 'festival', 'device', 'baby', 'beauty', 'tip', 'cooking', 'camping', 'trip',
];
export const MAX_INTERESTS = 3;
const HOT_LIKE_THRESHOLD = Number(process.env.HOT_LIKE_THRESHOLD ?? 10);

export function parseInterests(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_INTERESTS || value.some((v) => !INTERESTS.includes(v as string))) {
    throw badRequest(`관심사는 최대 ${MAX_INTERESTS}개까지 선택할 수 있습니다.`);
  }
  return [...new Set(value as string[])];
}

export interface UserRow {
  id: string;
  email: string | null;
  password_hash: string | null;
  nickname: string;
  bio: string;
  avatar_url: string | null;
  interests: string[];
  is_official: boolean;
  created_at: Date;
}

export interface PostRow {
  id: string;
  author_id: string;
  caption: string;
  created_at: Date;
  updated_at: Date;
  nickname: string;
  avatar_url: string | null;
  is_official: boolean;
  images: { url: string; alt: string }[];
  like_count: number;
  comment_count: number;
  liked: boolean;
}

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: Date;
  nickname: string;
  avatar_url: string | null;
}

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: Date | null;
  created_at: Date;
}

/** $1은 현재 사용자입니다. */
export const POST_SELECT = `
  SELECT p.*, u.nickname, u.avatar_url, u.is_official,
    COALESCE((SELECT json_agg(json_build_object('url', i.url, 'alt', i.alt) ORDER BY i.position)
      FROM post_images i WHERE i.post_id = p.id), '[]'::json) AS images,
    (SELECT count(*)::int FROM likes l WHERE l.post_id = p.id) AS like_count,
    (SELECT count(*)::int FROM comments c WHERE c.post_id = p.id) AS comment_count,
    EXISTS (SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = $1) AS liked
  FROM posts p JOIN users u ON u.id = p.author_id`;

export const toPublicUser = (u: Pick<UserRow, 'id' | 'nickname' | 'bio' | 'avatar_url' | 'interests' | 'is_official'>) => ({
  id: u.id,
  nickname: u.nickname,
  bio: u.bio,
  avatarUrl: u.avatar_url,
  interests: u.interests,
  isOfficial: u.is_official,
});

export const toMe = (u: UserRow) => ({ ...toPublicUser(u), email: u.email, hasPassword: u.password_hash !== null });

export const toPost = (p: PostRow) => ({
  id: p.id,
  author: { id: p.author_id, nickname: p.nickname, avatarUrl: p.avatar_url, isOfficial: p.is_official },
  isHot: p.like_count >= HOT_LIKE_THRESHOLD,
  caption: p.caption,
  images: p.images,
  likeCount: p.like_count,
  commentCount: p.comment_count,
  liked: p.liked,
  createdAt: p.created_at,
  edited: new Date(p.updated_at).getTime() !== new Date(p.created_at).getTime(),
});

export const toComment = (c: CommentRow) => ({
  id: c.id,
  postId: c.post_id,
  author: { id: c.author_id, nickname: c.nickname, avatarUrl: c.avatar_url },
  body: c.body,
  createdAt: c.created_at,
});

export const toMessage = (m: MessageRow) => ({
  id: m.id,
  conversationId: m.conversation_id,
  senderId: m.sender_id,
  body: m.body,
  readAt: m.read_at,
  createdAt: m.created_at,
});

export const encodeCursor = (createdAt: Date, id: string) =>
  Buffer.from(JSON.stringify([new Date(createdAt).toISOString(), id])).toString('base64url');

export function decodeCursor(cursor: string): { createdAt: string; id: string } {
  try {
    const [createdAt, id] = JSON.parse(Buffer.from(cursor, 'base64url').toString()) as [string, string];
    if (Number.isNaN(Date.parse(createdAt)) || !/^[0-9a-f-]{36}$/.test(id)) throw new Error();
    return { createdAt, id };
  } catch {
    throw badRequest('잘못된 페이지 정보입니다.');
  }
}
