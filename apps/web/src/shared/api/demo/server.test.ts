import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demoFetch, resetDemo, subscribeDemoEvents } from './server';

const call = async (method: string, path: string, body?: object, token?: string) => {
  const res = await demoFetch(path, {
    method,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: res.status, body: res.status === 204 ? null : await res.json() };
};
const login = async (email: string) =>
  (await call('POST', '/auth/login', { email, password: 'ieum-demo-1234' })).body.accessToken as string;

beforeEach(() => {
  localStorage.clear();
  resetDemo();
});

describe('데모 API', () => {
  it('비밀번호를 평문으로 저장하지 않고 틀리면 거부한다', async () => {
    const created = await call('POST', '/auth/signup', { email: 'a@example.com', password: 'Passw0rd!', nickname: '새싹' });
    expect(created.status).toBe(201);
    expect(localStorage.getItem('ieum.demo.state')).not.toContain('Passw0rd!');
    expect((await call('POST', '/auth/login', { email: 'a@example.com', password: 'wrong' })).status).toBe(401);
  });

  it('로그인하지 않으면 401, 다른 사람 글은 수정할 수 없다', async () => {
    expect((await call('GET', '/posts')).status).toBe(401);
    const token = await login('demo@ieum.app');
    expect((await call('PATCH', '/posts/p1', { caption: '탈취' }, token)).status).toBe(403);
  });

  it('피드는 최신순이고 인기 글을 표시하며, 차단하면 숨긴다', async () => {
    const token = await login('demo@ieum.app');
    const { body } = await call('GET', '/posts', undefined, token);
    expect(body.items[0].id).toBe('p1');
    expect(body.items[0].isHot).toBe(true);
    await call('PUT', '/users/haneul/block', undefined, token);
    const after = await call('GET', '/posts', undefined, token);
    expect(after.body.items.some((p: { author: { id: string } }) => p.author.id === 'haneul')).toBe(false);
  });

  it('메시지를 보내면 소켓 이벤트처럼 자동 답장과 읽음이 온다', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    const events: { type: string }[] = [];
    const stop = subscribeDemoEvents((event) => events.push(event as { type: string }));
    const token = await login('demo@ieum.app');
    await call('POST', '/conversations/dm1/messages', { body: '안녕하세요' }, token);
    expect(events.map((e) => e.type)).toEqual(['message']);
    vi.advanceTimersByTime(1300);
    vi.useRealTimers();
    stop();
    expect(events.map((e) => e.type)).toEqual(['message', 'read', 'message']);
    const list = await call('GET', '/conversations/dm1/messages', undefined, token);
    expect(list.body.items[1].readAt).not.toBeNull();
  });

  it('운영자만 신고를 보고, 정지하면 로그인이 막힌다', async () => {
    const member = await login('demo@ieum.app');
    expect((await call('GET', '/admin/reports', undefined, member)).status).toBe(403);
    const admin = await login('admin@ieum.app');
    const reports = await call('GET', '/admin/reports', undefined, admin);
    expect(reports.body[0].overdue).toBe(true);
    await call('POST', '/admin/reports/resolve', { targetType: 'post', targetId: 'p6', action: 'suspend' }, admin);
    expect((await call('POST', '/auth/login', { email: 'sora@ieum.app', password: 'ieum-demo-1234' })).status).toBe(403);
    await call('DELETE', '/admin/users/sora/suspension', undefined, admin);
    expect((await call('POST', '/auth/login', { email: 'sora@ieum.app', password: 'ieum-demo-1234' })).status).toBe(200);
  });

  it('수정하지 않은 시드 글은 수정됨으로 표시하지 않는다', async () => {
    const token = await login('demo@ieum.app');
    const { body } = await call('GET', '/posts', undefined, token);
    expect(body.items.every((p: { edited: boolean }) => !p.edited)).toBe(true);
  });

  it('없는 경로는 404로 응답한다', async () => {
    expect((await call('GET', '/없는경로')).status).toBe(404);
  });

  it('초기화하면 처음 데이터로 돌아간다', async () => {
    const token = await login('demo@ieum.app');
    await call('DELETE', '/posts/p5', undefined, token);
    resetDemo();
    expect((await call('GET', '/posts/p5', undefined, await login('demo@ieum.app'))).status).toBe(200);
  });
});
