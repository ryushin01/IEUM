import { MoreOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { App, Button, Dropdown } from 'antd';
import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { usePostFeed } from '@/entities/post';
import { useMe } from '@/entities/session';
import { useUser, type PublicUser } from '@/entities/user';
import { ReportDialog, useBlockUser, type ReportTarget } from '@/features/moderation';
import { request } from '@/shared/api';
import { useLoadMoreOnScroll, usePageTitle } from '@/shared/lib';
import { interestLabel } from '@/shared/config/interests';
import { EmptyView, ErrorView, LoadingView, OfficialMark, UserAvatar } from '@/shared/ui';
import * as s from './Profile.css';

function PostGrid({ authorId, nickname }: { authorId: string; nickname: string }) {
  const feed = usePostFeed(authorId);
  const sentinel = useLoadMoreOnScroll({
    hasNextPage: feed.hasNextPage,
    isFetchingNextPage: feed.isFetchingNextPage,
    fetchNextPage: feed.fetchNextPage,
  });
  if (feed.isPending) return <LoadingView label="게시글을 불러오는 중" />;
  if (feed.isError) return <ErrorView error={feed.error} onRetry={() => void feed.refetch()} />;
  const posts = feed.data.pages.flatMap((page) => page.items);
  if (posts.length === 0) return <EmptyView title="아직 게시글이 없습니다." />;
  return (
    <section className={s.posts} aria-labelledby="profile-posts">
      <h2 id="profile-posts" className={s.postsTitle}>작성 글</h2>
      <ul className={s.grid} aria-label={`${nickname} 님의 게시글`}>
        {posts.map((post, i) => (
          <li key={post.id}>
            <Link to={`/posts/${post.id}`} className={s.gridLink} aria-label={`게시글 ${i + 1}: ${post.caption.slice(0, 30)}`}>
              <img className={s.gridImage} src={post.images[0]?.url} alt="" loading="lazy" />
            </Link>
          </li>
        ))}
      </ul>
      <div ref={sentinel} />
      {feed.hasNextPage && (
        <div style={{ padding: 16 }}>
          <Button block loading={feed.isFetchingNextPage} onClick={() => void feed.fetchNextPage()}>더 보기</Button>
        </div>
      )}
    </section>
  );
}

function Head({ user, count }: { user: PublicUser; count?: number }) {
  return (
    <div className={s.head}>
      <UserAvatar nickname={user.nickname} src={user.avatarUrl} size={96} decorative={false} />
      <div className={s.info}>
        <h1 className={s.name}>{user.nickname} {user.isOfficial && <OfficialMark />}</h1>
        {count !== undefined && <p className={s.count}>게시글 <strong className={s.countValue}>{count}</strong>개</p>}
        {user.bio && <p className={s.bio}>{user.bio}</p>}
        {user.interests.length > 0 && (
          <ul className={s.interests} aria-label="관심사">
            {user.interests.map((interest) => <li key={interest} className={s.interest}>{interestLabel(interest)}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

export function MyProfilePage() {
  usePageTitle('내 정보');
  const me = useMe();
  const navigate = useNavigate();
  if (me.isPending) return <LoadingView />;
  if (me.isError) return <ErrorView error={me.error} onRetry={() => void me.refetch()} />;
  return (
    <>
      <Head user={me.data} />
      <div className={s.actions}>
        <Button block onClick={() => void navigate('/me/edit')}>프로필 편집</Button>
        <Button block onClick={() => void navigate('/settings')}>설정</Button>
      </div>
      <PostGrid authorId={me.data.id} nickname={me.data.nickname} />
    </>
  );
}

export function UserProfilePage() {
  const { id = '' } = useParams();
  const me = useMe();
  const user = useUser(id);
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const block = useBlockUser();
  const [report, setReport] = useState<ReportTarget | null>(null);
  const openChat = useMutation({
    mutationFn: (data: { userId: string }) =>
      request<{ id: string }>('/conversations', { method: 'POST', body: data }),
    onSuccess: ({ id: conversationId }) => void navigate(`/dm/${conversationId}`),
    onError: (error) => void message.error(error.message),
  });
  usePageTitle(user.data?.nickname ?? '프로필');

  if (me.data?.id === id) return <Navigate to="/me" replace />;
  if (user.isPending) return <LoadingView />;
  if (user.isError) return <ErrorView error={user.error} onRetry={() => void user.refetch()} />;
  const blocked = user.data.isBlocked;

  const confirmBlock = () =>
    modal.confirm({
      title: `${user.data.nickname} 님을 차단할까요?`,
      content: '서로의 게시글과 메시지가 보이지 않습니다. 설정에서 해제할 수 있습니다.',
      okText: '차단',
      cancelText: '취소',
      okButtonProps: { danger: true },
      onOk: () => block.mutateAsync({ userId: id, block: true }).catch((error: Error) => { void message.error(error.message); }),
    });

  return (
    <>
      <Head user={user.data} count={user.data.postCount} />
      <div className={s.actions}>
        {blocked ? (
          <Button block loading={block.isPending} onClick={() => { if (!block.isPending) block.mutate({ userId: id, block: false }); }}>차단 해제</Button>
        ) : (
          <Button type="primary" block loading={openChat.isPending} onClick={() => { if (!openChat.isPending) openChat.mutate({ userId: id }); }}>메시지 보내기</Button>
        )}
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              { key: 'report', label: '신고하기' },
              ...(blocked ? [] : [{ key: 'block', label: '차단하기', danger: true }]),
            ],
            onClick: ({ key }) => {
              if (key === 'report') setReport({ type: 'user', id });
              if (key === 'block') confirmBlock();
            },
          }}
        >
          <Button aria-label="사용자 메뉴" icon={<MoreOutlined aria-hidden="true" />} />
        </Dropdown>
      </div>
      {blocked ? <EmptyView title="차단한 사용자입니다." /> : <PostGrid authorId={id} nickname={user.data.nickname} />}
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </>
  );
}
