import { afterEach, describe, expect, it, vi } from 'vitest';
import { BridgeError, callNative, isNativeApp } from './bridge';

afterEach(() => {
  delete window.IeumBridge;
});

describe('callNative', () => {
  it('앱 밖에서는 not_native로 실패한다', async () => {
    expect(isNativeApp()).toBe(false);
    await expect(callNative('ui.haptic')).rejects.toMatchObject({ code: 'not_native' });
  });

  it('요청 번호로 응답을 찾아 돌려준다', async () => {
    const postMessage = vi.fn();
    window.IeumBridge = { postMessage };
    const promise = callNative('ui.setTheme', { mode: 'dark' });
    const sent = JSON.parse(postMessage.mock.calls[0]![0] as string);
    expect(sent).toMatchObject({ method: 'ui.setTheme', params: { mode: 'dark' } });
    window.__ieumBridgeReceive!({ id: sent.id, ok: true, result: null });
    await expect(promise).resolves.toBeNull();
  });

  it('앱의 오류를 코드와 함께 전달한다', async () => {
    const postMessage = vi.fn();
    window.IeumBridge = { postMessage };
    const promise = callNative('media.pick', { source: 'camera', maxCount: 1 });
    const { id } = JSON.parse(postMessage.mock.calls[0]![0] as string);
    window.__ieumBridgeReceive!({ id, ok: false, error: { code: 'permission_denied', message: '권한 필요' } });
    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BridgeError);
    expect(error).toMatchObject({ code: 'permission_denied', message: '권한 필요' });
  });
});
