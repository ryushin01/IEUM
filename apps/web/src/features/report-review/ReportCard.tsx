import { App, Button } from 'antd';
import { timeAgo } from '@/shared/lib';
import { useResolveReport, type ReportAction, type ReportGroup, type ReportTargetType } from './model';
import * as s from './ReportCard.css';

const TARGET_LABEL: Record<ReportTargetType, string> = { post: '게시글', comment: '댓글', user: '사용자', message: '메시지' };

export function ReportCard({ report }: { report: ReportGroup }) {
  const { modal, message } = App.useApp();
  const resolve = useResolveReport();
  const { preview, targetType, targetId } = report;

  const run = (action: ReportAction) =>
    resolve.mutateAsync({ targetType, targetId, action }).catch((error: Error) => { void message.error(error.message); });

  const confirm = (action: ReportAction, title: string, content: string, okText: string) =>
    modal.confirm({ title, content, okText, cancelText: '취소', okButtonProps: { danger: true }, onOk: () => run(action) });

  return (
    <li className={s.card}>
      <div className={s.head}>
        <strong>{TARGET_LABEL[targetType]} 신고 {report.count}건</strong>
        {report.overdue && <span className={s.overdue}>24시간 초과</span>}
      </div>
      <p className={s.meta}>
        <time dateTime={report.firstReportedAt}>{timeAgo(report.firstReportedAt)}</time> 접수 · {report.reasons.join(', ')}
      </p>
      {preview ? (
        <div className={s.body}>
          {preview.imageUrl && <img className={s.image} src={preview.imageUrl} alt="신고 대상 이미지" />}
          <div className={s.text}>
            <strong>{preview.authorNickname}</strong>
            {preview.text && <p>{preview.text}</p>}
          </div>
        </div>
      ) : <p className={s.body}>이미 삭제된 대상입니다.</p>}
      <div className={s.actions}>
        {preview && targetType !== 'user' && (
          <Button danger disabled={resolve.isPending} onClick={() => confirm('remove', `이 ${TARGET_LABEL[targetType]}을(를) 삭제할까요?`, '삭제하면 복구할 수 없습니다.', '삭제')}>
            콘텐츠 삭제
          </Button>
        )}
        {preview && (
          <Button danger disabled={resolve.isPending} onClick={() => confirm('suspend', `${preview.authorNickname} 님을 정지할까요?`, '바로 로그아웃되고 글이 모두 숨겨집니다. 아래 목록에서 해제할 수 있습니다.', '정지')}>
            사용자 정지
          </Button>
        )}
        <Button disabled={resolve.isPending} onClick={() => { if (!resolve.isPending) void run('dismiss'); }}>문제 없음</Button>
      </div>
    </li>
  );
}
