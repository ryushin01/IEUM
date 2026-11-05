import { useMutation } from '@tanstack/react-query';
import { Alert, App, Modal, Radio } from 'antd';
import { useState } from 'react';
import { request } from '@/shared/api';

export type ReportTarget = { type: 'post' | 'comment' | 'user' | 'message'; id: string };

const REASONS = ['스팸·광고', '욕설·혐오 표현', '음란·불쾌한 콘텐츠', '괴롭힘·따돌림', '기타 정책 위반'];

interface Props {
  target: ReportTarget | null;
  onClose: () => void;
}

export function ReportDialog({ target, onClose }: Props) {
  const { message } = App.useApp();
  const [reason, setReason] = useState<string>();
  const report = useMutation({
    mutationFn: (data: { targetType: string; targetId: string; reason: string }) =>
      request('/reports', { method: 'POST', body: data }),
    onSuccess: () => {
      void message.success('신고가 접수되었습니다. 24시간 이내에 검토합니다.');
      setReason(undefined);
      onClose();
    },
  });
  return (
    <Modal
      open={target !== null}
      title="신고하기"
      okText="신고"
      cancelText="취소"
      okButtonProps={{ disabled: !reason, loading: report.isPending }}
      onCancel={onClose}
      onOk={() => {
        if (target && reason && !report.isPending) {
          report.mutate({ targetType: target.type, targetId: target.id, reason });
        }
      }}
    >
      <Radio.Group
        aria-label="신고 사유"
        vertical
        value={reason}
        onChange={(e) => setReason(e.target.value as string)}
        options={REASONS.map((r) => ({ value: r, label: r }))}
      />
      {report.error && <Alert style={{ marginTop: 12 }} type="error" title={report.error.message} />}
    </Modal>
  );
}
