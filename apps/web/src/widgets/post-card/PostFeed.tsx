import { Button } from 'antd';
import { Link } from 'react-router';
import { usePostFeed } from '@/entities/post';
import { useLoadMoreOnScroll } from '@/shared/lib';
import { EmptyView, ErrorView, LoadingView } from '@/shared/ui';
import { PostCard } from './PostCard';
import { feedList } from './PostCard.css';

export function PostFeed() {
  const feed = usePostFeed();
  const sentinel = useLoadMoreOnScroll({
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
    fetchNextPage: feed.fetchNextPage,
  });

  if (feed.isPending) return <LoadingView label="게시글을 불러오는 중" />;
  if (feed.isError) return <ErrorView error={feed.error} onRetry={() => void feed.refetch()} />;
  const posts = feed.data.pages.flatMap((page) => page.items);
  if (posts.length === 0) {
    return <EmptyView title="아직 게시글이 없습니다." action={<Link to="/posts/new">첫 게시글 올리기</Link>} />;
  }
  return (
    <>
      <ul className={feedList}>
        {posts.map((post) => <li key={post.id}><PostCard post={post} list /></li>)}
      </ul>
      <div ref={sentinel} />
      {feed.hasNextPage && (
        <div style={{ padding: 16 }}>
          <Button block loading={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>더 보기</Button>
        </div>
      )}
    </>
  );
}
