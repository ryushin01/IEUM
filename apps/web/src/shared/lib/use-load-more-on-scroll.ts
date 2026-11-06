import { useEffect, useRef } from 'react';

interface Options {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => unknown;
}

/** 돌려준 ref의 요소가 화면 가까이 오면 다음 페이지를 불러옵니다. 관찰을 쓸 수 없는 환경을 위해 버튼을 함께 둡니다. */
export function useLoadMoreOnScroll({ hasNextPage, isFetchingNextPage, fetchNextPage }: Options) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  return sentinel;
}
