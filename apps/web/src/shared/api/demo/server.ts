import { BASE_URL } from '@/shared/config';
import { createSeed, DEMO_PASSWORD, mergeSeed, SEED_VERSION, type DemoMessage, type DemoPost, type DemoState, type DemoUser } from './seed';

/**
 * 실제 API(apps/api)와 같은 응답을 주는 브라우저 안 목업입니다.
 * 웹은 MSW(handlers.ts)를 거쳐, 앱은 브리지(demoRequest)로 이 함수를 호출합니다. 화면 코드는 실제 모드와 같습니다.
 */
const STORAGE_KEY = 'ieum.demo.state';
const PAGE_SIZE = 10;
const MESSAGE_PAGE = 30;
const HOT_LIKES = 3;
const PASSWORD = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,72}$/;
const NICKNAME = /^[\p{L}\p{N}_.]{2,20}$/u;
const AUTO_REPLIES = ['좋아요! 다음에 또 얘기해요 :)', '오, 그렇군요! 사진도 기대할게요.', '답장 잘 받았어요. 이건 데모의 자동 응답이에요.'];

class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, message: string, code = 'bad_request') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

let state: DemoState | null = null;
let loading: Promise<DemoState> | null = null;
/** 초기화할 때마다 올려, 그 전에 시작한 읽기가 이전 데이터를 되살리지 못하게 합니다. */
let generation = 0;
let replyIndex = 0;
const listeners = new Set<(event: unknown) => void>();

export function subscribeDemoEvents(listener: (event: unknown) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
const emit = (event: unknown) => listeners.forEach((listener) => listener(event));

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** 저장 데이터를 읽고 합친 뒤에만 state에 넣어, 준비 전의 상태를 다른 요청이 고치지 못하게 합니다. */
async function read(): Promise<DemoState> {
  const started = generation;
  let stored: DemoState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw) as DemoState;
  } catch {
    // 저장소를 못 쓰면 메모리로만 동작합니다.
  }
  if (stored && (stored.seedVersion ?? 1) >= SEED_VERSION) {
    state = stored;
    return stored;
  }
  const seed = createSeed(await sha256(DEMO_PASSWORD));
  // 기다리는 동안 초기화되었으면 결과를 버리고, 초기화 뒤의 읽기에 합류합니다.
  if (started !== generation) return load();
  state = stored ? mergeSeed(stored, seed) : seed;
  // 합친 결과를 저장해야 지운 샘플 글이 다음 실행에 되살아나지 않습니다.
  if (stored) save();
  return state;
}

function load(): Promise<DemoState> {
  if (state) return Promise.resolve(state);
  // 동시에 들어온 요청은 같은 준비 작업을 기다립니다.
  if (loading) return loading;
  const current = read().finally(() => {
    if (loading === current) loading = null;
  });
  loading = current;
  return current;
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 용량이 부족하면 이번 실행에만 유지합니다.
  }
}

export function resetDemo(): void {
  state = null;
  loading = null;
  generation += 1;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('ieum.tokens');
  } catch {
    // 다음 실행에 다시 시도합니다.
  }
}

const newId = () => crypto.randomUUID();
const tokensFor = (userId: string) => ({ accessToken: `demo.${userId}`, refreshToken: `demo.${userId}` });

const toPublic = (u: DemoUser) => ({
  id: u.id, nickname: u.nickname, bio: u.bio, avatarUrl: u.avatarUrl, interests: u.interests, isOfficial: u.isOfficial,
});
const toMe = (u: DemoUser) => ({ ...toPublic(u), email: u.email, hasPassword: u.passwordHash !== null, isAdmin: u.isAdmin });

function checkNickname(db: DemoState, nickname: unknown, exceptId?: string): asserts nickname is string {
  if (typeof nickname !== 'string' || !NICKNAME.test(nickname)) throw new HttpError(400, '닉네임은 2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.');
  if (db.users.some((u) => u.nickname === nickname && u.id !== exceptId)) throw new HttpError(409, '이미 사용 중인 닉네임입니다.', 'conflict');
}

const hidden = (db: DemoState, me: string, other: string) =>
  db.blocks.some(([a, b]) => (a === me && b === other) || (a === other && b === me)) ||
  db.users.find((u) => u.id === other)?.suspendedAt != null;

function toPost(db: DemoState, post: DemoPost, me: string) {
  const author = db.users.find((u) => u.id === post.authorId)!;
  return {
    id: post.id,
    author: { id: author.id, nickname: author.nickname, avatarUrl: author.avatarUrl, isOfficial: author.isOfficial },
    isHot: post.likes.length >= HOT_LIKES,
    caption: post.caption,
    images: post.images,
    likeCount: post.likes.length,
    commentCount: db.comments.filter((c) => c.postId === post.id).length,
    liked: post.likes.includes(me),
    createdAt: post.createdAt,
    edited: post.updatedAt !== post.createdAt,
  };
}

function toComment(db: DemoState, c: DemoState['comments'][number]) {
  const author = db.users.find((u) => u.id === c.authorId)!;
  return { id: c.id, postId: c.postId, author: { id: author.id, nickname: author.nickname, avatarUrl: author.avatarUrl }, body: c.body, createdAt: c.createdAt };
}

function findPost(db: DemoState, id: string, me: string): DemoPost {
  const post = db.posts.find((p) => p.id === id);
  if (!post || hidden(db, me, post.authorId)) throw new HttpError(404, '게시글을 찾을 수 없습니다.', 'not_found');
  return post;
}

function membership(db: DemoState, id: string, me: string) {
  const conversation = db.conversations.find((c) => c.id === id && c.members.includes(me));
  if (!conversation) throw new HttpError(404, '대화를 찾을 수 없습니다.', 'not_found');
  return conversation.members.find((m) => m !== me)!;
}

/** 작성 화면과 프로필에 쓸 수 있도록 줄인 이미지를 data URL로 저장합니다. */
async function readImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new HttpError(400, 'JPG, PNG, WebP 이미지만 올릴 수 있습니다.');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new HttpError(400, '이미지를 읽을 수 없습니다. 다른 파일을 선택해 주세요.');
  });
  const scale = Math.min(1, 1080 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/webp', 0.75);
}

function scheduleReply(conversationId: string, me: string, otherId: string) {
  window.setTimeout(() => {
    const db = state;
    if (!db || !db.conversations.some((c) => c.id === conversationId)) return;
    const now = new Date().toISOString();
    db.messages.forEach((m) => {
      if (m.conversationId === conversationId && m.senderId === me && !m.readAt) m.readAt = now;
    });
    const message: DemoMessage = {
      id: newId(), conversationId, senderId: otherId, body: AUTO_REPLIES[replyIndex++ % AUTO_REPLIES.length]!, readAt: null, createdAt: now,
    };
    db.messages.push(message);
    save();
    emit({ type: 'read', conversationId });
    emit({ type: 'message', message });
  }, 1200);
}

function reportPreview(db: DemoState, type: string, id: string) {
  const authorOf = (userId: string) => db.users.find((u) => u.id === userId);
  if (type === 'post') {
    const post = db.posts.find((p) => p.id === id);
    if (!post) return null;
    return { text: post.caption, imageUrl: post.images[0]?.url ?? null, authorId: post.authorId, authorNickname: authorOf(post.authorId)?.nickname ?? null };
  }
  if (type === 'comment') {
    const comment = db.comments.find((c) => c.id === id);
    return comment ? { text: comment.body, imageUrl: null, authorId: comment.authorId, authorNickname: authorOf(comment.authorId)?.nickname ?? null } : null;
  }
  const target = authorOf(id);
  return target ? { text: target.bio, imageUrl: target.avatarUrl, authorId: target.id, authorNickname: target.nickname } : null;
}

type Body = Record<string, unknown>;

async function route(method: string, url: URL, body: Body, form: FormData | null, token: string | null): Promise<{ status?: number; data?: unknown }> {
  const db = await load();
  const path = url.pathname;
  const seg = path.split('/').filter(Boolean);
  const auth = (): string => {
    const id = token?.startsWith('demo.') ? token.slice(5) : null;
    const found = db.users.find((u) => u.id === id && !u.suspendedAt);
    if (!found) throw new HttpError(401, '로그인이 필요합니다.', 'unauthorized');
    return found.id;
  };
  const admin = () => {
    const me = auth();
    if (!db.users.find((u) => u.id === me)?.isAdmin) throw new HttpError(403, '권한이 없습니다.', 'forbidden');
    return me;
  };
  const key = `${method} ${path}`;

  // 인증
  if (key === 'GET /auth/nickname-available') {
    const nickname = url.searchParams.get('nickname') ?? '';
    if (!NICKNAME.test(nickname)) throw new HttpError(400, '닉네임은 2~20자의 글자, 숫자, 밑줄, 마침표로 입력해 주세요.');
    return { data: { available: !db.users.some((u) => u.nickname === nickname) } };
  }
  if (key === 'POST /auth/signup') {
    const email = String(body.email ?? '').toLowerCase();
    if (typeof body.password !== 'string' || !PASSWORD.test(body.password)) throw new HttpError(400, '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.');
    checkNickname(db, body.nickname);
    if (db.users.some((u) => u.email === email)) throw new HttpError(409, '이미 사용 중인 이메일 또는 닉네임입니다.', 'conflict');
    const created: DemoUser = {
      id: newId(), email, passwordHash: await sha256(body.password), nickname: body.nickname, bio: '', avatarUrl: null,
      interests: (body.interests as string[]) ?? [], isOfficial: false, isAdmin: false, suspendedAt: null,
    };
    db.users.push(created);
    return { status: 201, data: { user: toMe(created), ...tokensFor(created.id) } };
  }
  if (key === 'POST /auth/login') {
    const found = db.users.find((u) => u.email === String(body.email ?? '').toLowerCase());
    if (!found?.passwordHash || found.passwordHash !== (await sha256(String(body.password ?? '')))) {
      throw new HttpError(401, '이메일 또는 비밀번호가 올바르지 않습니다.', 'invalid_credentials');
    }
    if (found.suspendedAt) throw new HttpError(403, '이용이 제한된 계정입니다. 문의해 주세요.', 'suspended');
    return { data: { user: toMe(found), ...tokensFor(found.id) } };
  }
  if (key === 'POST /auth/refresh') throw new HttpError(401, '세션이 만료되었습니다. 다시 로그인해 주세요.', 'unauthorized');
  if (key === 'POST /auth/logout') return { status: 204 };
  if (key === 'POST /auth/password-reset/request') {
    const found = db.users.find((u) => u.email === String(body.email ?? '').toLowerCase() && u.passwordHash);
    // 데모에는 메일이 없으므로 링크를 화면에 보여 줍니다. 가입되지 않은 이메일에는 주지 않습니다.
    if (!found) return { status: 202, data: { ok: true, demoLink: null } };
    const resetToken = newId();
    db.resets[resetToken] = found.id;
    return { status: 202, data: { ok: true, demoLink: `${BASE_URL}reset-password#token=${resetToken}` } };
  }
  if (key === 'POST /auth/password-reset/confirm') {
    if (typeof body.password !== 'string' || !PASSWORD.test(body.password)) throw new HttpError(400, '비밀번호는 영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.');
    const userId = db.resets[String(body.token)];
    if (!userId) throw new HttpError(401, '링크가 만료되었거나 이미 사용되었습니다. 다시 요청해 주세요.', 'unauthorized');
    delete db.resets[String(body.token)];
    db.users.find((u) => u.id === userId)!.passwordHash = await sha256(body.password);
    return { status: 204 };
  }

  // 소셜 로그인: 실제 제공자 없이 흐름만 보여 줍니다.
  if (key === 'GET /auth/social/providers') return { data: ['kakao', 'naver', 'google', 'apple'] };
  if (method === 'POST' && seg[0] === 'auth' && seg[1] === 'social' && seg[3] === 'start') {
    return { data: { url: `${BASE_URL}auth/callback?code=${seg[2]}` } };
  }
  if (key === 'POST /auth/social/exchange') {
    const provider = String(body.code);
    const found = db.users.find((u) => u.socialKey === provider);
    if (found) return { data: { status: 'login', user: toMe(found), ...tokensFor(found.id) } };
    return { data: { status: 'signup', signupToken: provider, provider, nickname: `${provider}사용자` } };
  }
  if (key === 'POST /auth/social/signup') {
    checkNickname(db, body.nickname);
    const created: DemoUser = {
      id: newId(), email: null, passwordHash: null, nickname: body.nickname, bio: '', avatarUrl: null,
      interests: (body.interests as string[]) ?? [], isOfficial: false, isAdmin: false, suspendedAt: null, socialKey: String(body.signupToken),
    };
    db.users.push(created);
    return { status: 201, data: { user: toMe(created), ...tokensFor(created.id) } };
  }

  // 내 정보
  if (key === 'GET /me') return { data: toMe(db.users.find((u) => u.id === auth())!) };
  if (key === 'PATCH /me') {
    const me = db.users.find((u) => u.id === auth())!;
    if (body.nickname !== undefined) {
      checkNickname(db, body.nickname, me.id);
      me.nickname = body.nickname;
    }
    if (typeof body.bio === 'string') me.bio = body.bio;
    if (body.avatarUrl !== undefined) me.avatarUrl = body.avatarUrl as string | null;
    if (Array.isArray(body.interests)) me.interests = body.interests as string[];
    return { data: toMe(me) };
  }
  if (key === 'DELETE /me') {
    const me = db.users.find((u) => u.id === auth())!;
    if (me.passwordHash ? me.passwordHash !== (await sha256(String(body.password ?? ''))) : body.confirmText !== '삭제') {
      throw new HttpError(403, me.passwordHash ? '비밀번호가 올바르지 않습니다.' : '확인 문구를 정확히 입력해 주세요.', 'invalid_credentials');
    }
    const postIds = new Set(db.posts.filter((p) => p.authorId === me.id).map((p) => p.id));
    const conversationIds = new Set(db.conversations.filter((c) => c.members.includes(me.id)).map((c) => c.id));
    db.posts = db.posts.filter((p) => p.authorId !== me.id);
    db.posts.forEach((p) => { p.likes = p.likes.filter((id) => id !== me.id); });
    db.comments = db.comments.filter((c) => c.authorId !== me.id && !postIds.has(c.postId));
    db.conversations = db.conversations.filter((c) => !conversationIds.has(c.id));
    db.messages = db.messages.filter((m) => !conversationIds.has(m.conversationId));
    db.blocks = db.blocks.filter(([a, b]) => a !== me.id && b !== me.id);
    db.users = db.users.filter((u) => u.id !== me.id);
    return { status: 204 };
  }
  if (key === 'GET /me/blocks') {
    const me = auth();
    return { data: db.blocks.filter(([a]) => a === me).map(([, b]) => toPublic(db.users.find((u) => u.id === b)!)) };
  }

  // 사용자
  if (seg[0] === 'users' && seg[1]) {
    const me = auth();
    const target = db.users.find((u) => u.id === seg[1]);
    const blockedMe = db.blocks.some(([a, b]) => a === seg[1] && b === me);
    if (!target || blockedMe || target.suspendedAt) throw new HttpError(404, '사용자를 찾을 수 없습니다.', 'not_found');
    if (seg[2] === 'block') {
      db.blocks = db.blocks.filter(([a, b]) => !(a === me && b === target.id));
      if (method === 'PUT') db.blocks.push([me, target.id]);
      return { status: 204 };
    }
    return {
      data: {
        ...toPublic(target),
        postCount: db.posts.filter((p) => p.authorId === target.id).length,
        isBlocked: db.blocks.some(([a, b]) => a === me && b === target.id),
      },
    };
  }
  if (key === 'POST /reports') {
    db.reports.push({
      id: newId(), reporterId: auth(), targetType: String(body.targetType), targetId: String(body.targetId),
      reason: String(body.reason), createdAt: new Date().toISOString(), open: true,
    });
    return { status: 201, data: { ok: true } };
  }

  // 게시글
  if (key === 'GET /posts') {
    const me = auth();
    const authorId = url.searchParams.get('authorId');
    const offset = Number(url.searchParams.get('cursor') ?? 0);
    const list = db.posts
      .filter((p) => !hidden(db, me, p.authorId) && (!authorId || p.authorId === authorId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return {
      data: {
        items: list.slice(offset, offset + PAGE_SIZE).map((p) => toPost(db, p, me)),
        nextCursor: offset + PAGE_SIZE < list.length ? String(offset + PAGE_SIZE) : null,
      },
    };
  }
  if (key === 'POST /posts') {
    const me = auth();
    const now = new Date().toISOString();
    const created: DemoPost = {
      id: newId(), authorId: me, caption: String(body.caption ?? '').trim(),
      images: body.images as DemoPost['images'], likes: [], createdAt: now, updatedAt: now,
    };
    db.posts.push(created);
    return { status: 201, data: toPost(db, created, me) };
  }
  if (seg[0] === 'posts' && seg[1]) {
    const me = auth();
    const post = findPost(db, seg[1], me);
    if (seg[2] === 'like') {
      post.likes = post.likes.filter((id) => id !== me);
      if (method === 'PUT') post.likes.push(me);
      return { data: toPost(db, post, me) };
    }
    if (seg[2] === 'comments') {
      if (method === 'GET') {
        return { data: db.comments.filter((c) => c.postId === post.id && !hidden(db, me, c.authorId)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map((c) => toComment(db, c)) };
      }
      const comment = { id: newId(), postId: post.id, authorId: me, body: String(body.body ?? '').trim(), createdAt: new Date().toISOString() };
      db.comments.push(comment);
      return { status: 201, data: toComment(db, comment) };
    }
    if (method === 'GET') return { data: toPost(db, post, me) };
    if (post.authorId !== me) throw new HttpError(403, '권한이 없습니다.', 'forbidden');
    if (method === 'PATCH') {
      post.caption = String(body.caption ?? '').trim();
      post.updatedAt = new Date().toISOString();
      return { data: toPost(db, post, me) };
    }
    db.posts = db.posts.filter((p) => p.id !== post.id);
    db.comments = db.comments.filter((c) => c.postId !== post.id);
    return { status: 204 };
  }
  if (method === 'DELETE' && seg[0] === 'comments') {
    const me = auth();
    const comment = db.comments.find((c) => c.id === seg[1]);
    if (!comment) throw new HttpError(404, '댓글을 찾을 수 없습니다.', 'not_found');
    const owner = db.posts.find((p) => p.id === comment.postId)?.authorId;
    if (comment.authorId !== me && owner !== me) throw new HttpError(403, '권한이 없습니다.', 'forbidden');
    db.comments = db.comments.filter((c) => c.id !== comment.id);
    return { status: 204 };
  }

  // 이미지
  if (key === 'POST /uploads') {
    auth();
    const file = form?.get('file');
    if (!(file instanceof File)) throw new HttpError(400, '이미지를 선택해 주세요.');
    return { status: 201, data: { url: await readImage(file) } };
  }

  // DM
  if (key === 'GET /conversations') {
    const me = auth();
    const rows = db.conversations.filter((c) => c.members.includes(me)).flatMap((c) => {
      const otherId = c.members.find((m) => m !== me)!;
      const messages = db.messages.filter((m) => m.conversationId === c.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const last = messages.at(-1);
      if (!last || hidden(db, me, otherId)) return [];
      return [{
        id: c.id,
        other: toPublic(db.users.find((u) => u.id === otherId)!),
        lastMessage: last.body,
        lastMessageAt: last.createdAt,
        unreadCount: messages.filter((m) => m.senderId !== me && !m.readAt).length,
      }];
    });
    return { data: rows.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt)) };
  }
  if (key === 'POST /conversations') {
    const me = auth();
    const otherId = String(body.userId);
    if (hidden(db, me, otherId)) throw new HttpError(403, '대화할 수 없는 사용자입니다.', 'forbidden');
    let conversation = db.conversations.find((c) => c.members.includes(me) && c.members.includes(otherId));
    if (!conversation) {
      conversation = { id: newId(), members: [me, otherId] };
      db.conversations.push(conversation);
    }
    return { data: { id: conversation.id } };
  }
  if (seg[0] === 'conversations' && seg[1]) {
    const me = auth();
    const otherId = membership(db, seg[1], me);
    if (seg[2] === 'messages' && method === 'GET') {
      const offset = Number(url.searchParams.get('cursor') ?? 0);
      const list = db.messages.filter((m) => m.conversationId === seg[1]).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return {
        data: {
          items: list.slice(offset, offset + MESSAGE_PAGE),
          nextCursor: offset + MESSAGE_PAGE < list.length ? String(offset + MESSAGE_PAGE) : null,
        },
      };
    }
    if (seg[2] === 'messages') {
      if (hidden(db, me, otherId)) throw new HttpError(403, '메시지를 보낼 수 없는 사용자입니다.', 'forbidden');
      const message: DemoMessage = { id: newId(), conversationId: seg[1], senderId: me, body: String(body.body ?? '').trim(), readAt: null, createdAt: new Date().toISOString() };
      db.messages.push(message);
      emit({ type: 'message', message });
      scheduleReply(seg[1], me, otherId);
      return { status: 201, data: message };
    }
    if (seg[2] === 'read') {
      const now = new Date().toISOString();
      db.messages.forEach((m) => {
        if (m.conversationId === seg[1] && m.senderId !== me && !m.readAt) m.readAt = now;
      });
      return { status: 204 };
    }
    return { data: { id: seg[1], other: toPublic(db.users.find((u) => u.id === otherId)!), canSend: !hidden(db, me, otherId) } };
  }

  // 운영자
  if (key === 'GET /admin/reports') {
    admin();
    const groups = new Map<string, DemoState['reports']>();
    db.reports.filter((r) => r.open).forEach((r) => {
      const groupKey = `${r.targetType}:${r.targetId}`;
      groups.set(groupKey, [...(groups.get(groupKey) ?? []), r]);
    });
    const list = [...groups.values()].map((reports) => {
      const first = reports.map((r) => r.createdAt).sort()[0]!;
      return {
        targetType: reports[0]!.targetType,
        targetId: reports[0]!.targetId,
        count: reports.length,
        reasons: [...new Set(reports.map((r) => r.reason))],
        firstReportedAt: first,
        overdue: Date.now() - new Date(first).getTime() > 24 * 3_600_000,
        preview: reportPreview(db, reports[0]!.targetType, reports[0]!.targetId),
      };
    });
    return { data: list.sort((a, b) => a.firstReportedAt.localeCompare(b.firstReportedAt)) };
  }
  if (key === 'POST /admin/reports/resolve') {
    const me = admin();
    const { targetType, targetId, action } = body as Record<string, string>;
    const preview = reportPreview(db, targetType!, targetId!);
    if (action !== 'dismiss' && !preview) throw new HttpError(404, '이미 삭제된 대상입니다. 문제 없음으로 처리해 주세요.', 'not_found');
    if (action === 'remove') {
      if (targetType === 'post') {
        db.posts = db.posts.filter((p) => p.id !== targetId);
        db.comments = db.comments.filter((c) => c.postId !== targetId);
      } else {
        db.comments = db.comments.filter((c) => c.id !== targetId);
      }
    }
    if (action === 'suspend') {
      const target = db.users.find((u) => u.id === preview!.authorId)!;
      if (target.id === me || target.isAdmin) throw new HttpError(400, '운영자는 정지할 수 없습니다.');
      target.suspendedAt = new Date().toISOString();
    }
    db.reports.forEach((r) => {
      if (r.targetType === targetType && r.targetId === targetId) r.open = false;
    });
    return { status: 204 };
  }
  if (key === 'GET /admin/users/suspended') {
    admin();
    return { data: db.users.filter((u) => u.suspendedAt).map((u) => ({ id: u.id, nickname: u.nickname, suspendedAt: u.suspendedAt })) };
  }
  if (method === 'DELETE' && seg[0] === 'admin' && seg[3] === 'suspension') {
    admin();
    db.users.find((u) => u.id === seg[2])!.suspendedAt = null;
    return { status: 204 };
  }
  throw new HttpError(404, '찾을 수 없습니다.', 'not_found');
}

export async function demoFetch(path: string, init: RequestInit): Promise<Response> {
  const headers = init.headers as Record<string, string> | undefined;
  const token = headers?.authorization?.replace('Bearer ', '') ?? null;
  const form = init.body instanceof FormData ? init.body : null;
  const body = typeof init.body === 'string' ? (JSON.parse(init.body) as Body) : {};
  try {
    const { status = 200, data } = await route(init.method ?? 'GET', new URL(path, 'https://demo.invalid'), body, form, token);
    if (init.method && init.method !== 'GET') save();
    return status === 204 ? new Response(null, { status }) : Response.json(data, { status });
  } catch (error) {
    if (error instanceof HttpError) return Response.json({ code: error.code, message: error.message }, { status: error.status });
    throw error;
  }
}
