import { Button } from 'antd';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { usePostFeed } from '@/entities/post';
import { EmptyView, ErrorView, LoadingView } from '@/shared/ui';
import { PostCard } from './PostCard';

export function PostFeed() {
  const feed = usePostFeed();
  const sentinel = useRef<HTMLDivElement>(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = feed;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: '600px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (feed.isPending) return <LoadingView label="게시글을 불러오는 중" />;
  if (feed.isError) return <ErrorView error={feed.error} onRetry={() => void feed.refetch()} />;
  const posts = feed.data.pages.flatMap((page) => page.items);
  if (posts.length === 0) {
    return <EmptyView title="아직 게시글이 없습니다." action={<Link to="/posts/new">첫 게시글 올리기</Link>} />;
  }
  return (
    <>
      <ul>
        {posts.map((post) => <li key={post.id}><PostCard post={post} list /></li>)}
      </ul>
      <div ref={sentinel} />
      {hasNextPage && (
        <div style={{ padding: 16 }}>
          <Button block loading={isFetchingNextPage} onClick={() => void fetchNextPage()}>더 보기</Button>
        </div>
      )}
    </>
  );
}
