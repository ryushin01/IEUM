import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoadMoreOnScroll } from './use-load-more-on-scroll';

let notify: (entries: { isIntersecting: boolean }[]) => void;
const disconnect = vi.fn();

function View(props: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => void }) {
  return <div ref={useLoadMoreOnScroll(props)} />;
}

describe('useLoadMoreOnScroll', () => {
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      constructor(callback: typeof notify) { notify = callback; }
      observe() {}
      disconnect = disconnect;
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('화면 가까이 오면 다음 페이지를 부르고, 멀면 부르지 않는다', () => {
    const fetchNextPage = vi.fn();
    render(<View hasNextPage isFetchingNextPage={false} fetchNextPage={fetchNextPage} />);
    notify([{ isIntersecting: false }]);
    expect(fetchNextPage).not.toHaveBeenCalled();
    notify([{ isIntersecting: true }]);
    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it('불러오는 중에는 다시 부르지 않는다', () => {
    const fetchNextPage = vi.fn();
    render(<View hasNextPage isFetchingNextPage fetchNextPage={fetchNextPage} />);
    notify([{ isIntersecting: true }]);
    expect(fetchNextPage).not.toHaveBeenCalled();
  });

  it('다음 페이지가 없으면 관찰하지 않는다', () => {
    const constructed = vi.fn();
    vi.stubGlobal('IntersectionObserver', class { constructor() { constructed(); } observe() {} disconnect() {} });
    render(<View hasNextPage={false} isFetchingNextPage={false} fetchNextPage={vi.fn()} />);
    expect(constructed).not.toHaveBeenCalled();
  });
});
