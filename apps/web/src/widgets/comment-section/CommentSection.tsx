import { MoreOutlined } from '@ant-design/icons';
import { App, Button, Dropdown } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { useComments, type Comment } from '@/entities/post';
import { useMe } from '@/entities/session';
import { ReportDialog, type ReportTarget } from '@/features/moderation';
import { CommentForm, useDeleteComment } from '@/features/post-comment';
import { timeAgo } from '@/shared/lib';
import { EmptyView, ErrorView, LoadingView, UserAvatar } from '@/shared/ui';
import * as s from './CommentSection.css';

export function CommentSection({ postId, postAuthorId }: { postId: string; postAuthorId: string }) {
  const comments = useComments(postId);
  const [report, setReport] = useState<ReportTarget | null>(null);
  return (
    <section className={s.section} aria-labelledby="comments-title">
      <h2 id="comments-title" className={s.title}>댓글</h2>
      {comments.isPending && <LoadingView label="댓글을 불러오는 중" />}
      {comments.isError && <ErrorView error={comments.error} onRetry={() => void comments.refetch()} />}
      {comments.data?.length === 0 && <EmptyView title="첫 댓글을 남겨 보세요." />}
      {!!comments.data?.length && (
        <ul className={s.list}>
          {comments.data.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} postAuthorId={postAuthorId} onReport={setReport} />
          ))}
        </ul>
      )}
      <CommentForm postId={postId} />
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </section>
  );
}

interface ItemProps {
  comment: Comment;
  postId: string;
  postAuthorId: string;
  onReport: (target: ReportTarget) => void;
}

function CommentItem({ comment, postId, postAuthorId, onReport }: ItemProps) {
  const { data: me } = useMe();
  const { message } = App.useApp();
  const remove = useDeleteComment(postId);
  const canDelete = me?.id === comment.author.id || me?.id === postAuthorId;
  const items = [
    ...(me?.id !== comment.author.id ? [{ key: 'report', label: '신고하기' }] : []),
    ...(canDelete ? [{ key: 'delete', label: '삭제하기', danger: true }] : []),
  ];
  return (
    <li className={s.item}>
      <UserAvatar nickname={comment.author.nickname} src={comment.author.avatarUrl} size={28} />
      <div>
        <Link to={`/users/${comment.author.id}`} className={s.author}>{comment.author.nickname}</Link>
        <p className={s.body}>{comment.body}</p>
        <time className={s.date} dateTime={comment.createdAt}>{timeAgo(comment.createdAt)}</time>
      </div>
      <Dropdown
        trigger={['click']}
        placement="bottomRight"
        menu={{
          items,
          onClick: ({ key }) => {
            if (key === 'report') onReport({ type: 'comment', id: comment.id });
            if (key === 'delete' && !remove.isPending) {
              remove.mutate(comment.id, { onError: (error) => void message.error(error.message) });
            }
          },
        }}
      >
        <Button type="text" aria-label={`${comment.author.nickname} 님의 댓글 메뉴`} icon={<MoreOutlined aria-hidden="true" />} />
      </Dropdown>
    </li>
  );
}
