import { MoreOutlined } from '@ant-design/icons';
import { App, Button, Dropdown } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import type { Post } from '@/entities/post';
import { useMe } from '@/entities/session';
import { ReportDialog, useBlockUser, type ReportTarget } from '@/features/moderation';
import { useDeletePost } from '@/features/post-delete';

export function PostActionsMenu({ post }: { post: Post }) {
  const { data: me } = useMe();
  const { modal, message } = App.useApp();
  const navigate = useNavigate();
  const remove = useDeletePost();
  const block = useBlockUser();
  const [report, setReport] = useState<ReportTarget | null>(null);
  const mine = me?.id === post.author.id;

  const items = mine
    ? [{ key: 'edit', label: '수정하기' }, { key: 'delete', label: '삭제하기', danger: true }]
    : [{ key: 'report', label: '신고하기' }, { key: 'block', label: `${post.author.nickname} 님 차단`, danger: true }];

  const onSelect = ({ key }: { key: string }) => {
    if (key === 'edit') void navigate(`/posts/${post.id}/edit`);
    if (key === 'report') setReport({ type: 'post', id: post.id });
    if (key === 'delete') {
      modal.confirm({
        title: '게시글을 삭제할까요?',
        content: '삭제하면 복구할 수 없습니다.',
        okText: '삭제',
        cancelText: '취소',
        okButtonProps: { danger: true },
        onOk: () => remove.mutateAsync(post.id).then(
          () => { if (location.pathname.startsWith('/posts/')) void navigate('/', { replace: true }); },
          (error: Error) => { void message.error(error.message); },
        ),
      });
    }
    if (key === 'block') {
      modal.confirm({
        title: `${post.author.nickname} 님을 차단할까요?`,
        content: '서로의 게시글과 메시지가 보이지 않습니다. 설정에서 해제할 수 있습니다.',
        okText: '차단',
        cancelText: '취소',
        okButtonProps: { danger: true },
        onOk: () => block.mutateAsync({ userId: post.author.id, block: true }).catch((error: Error) => { void message.error(error.message); }),
      });
    }
  };

  return (
    <>
      <Dropdown menu={{ items, onClick: onSelect }} trigger={['click']} placement="bottomRight">
        <Button type="text" aria-label="게시글 메뉴" icon={<MoreOutlined aria-hidden="true" />} />
      </Dropdown>
      <ReportDialog target={report} onClose={() => setReport(null)} />
    </>
  );
}
