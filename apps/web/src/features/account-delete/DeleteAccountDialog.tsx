import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Form, Input, Modal } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { clearSession, request } from '@/shared/api';

/** 소셜 계정은 비밀번호가 없어 확인 문구를 입력합니다. */
export function DeleteAccountDialog({ open, hasPassword, onClose }: { open: boolean; hasPassword: boolean; onClose: () => void }) {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const remove = useMutation({
    mutationFn: (data: { password: string } | { confirmText: string }) => request('/me', { method: 'DELETE', body: data }),
    onSuccess: async () => {
      await clearSession();
      client.clear();
      navigate('/login', { replace: true });
    },
  });
  return (
    <Modal
      open={open}
      title="계정 삭제"
      okText="영구 삭제"
      cancelText="취소"
      okButtonProps={{ danger: true, disabled: !value, loading: remove.isPending }}
      onCancel={onClose}
      onOk={() => { if (!remove.isPending) remove.mutate(hasPassword ? { password: value } : { confirmText: value }); }}
    >
      <p style={{ marginBottom: 12 }}>게시글, 댓글, 메시지가 모두 삭제되며 복구할 수 없습니다.</p>
      <Form layout="vertical">
        {hasPassword ? (
          <Form.Item label="비밀번호 확인" htmlFor="delete-password">
            <Input.Password id="delete-password" autoComplete="current-password" visibilityToggle={false} value={value} onChange={(e) => setValue(e.target.value)} />
          </Form.Item>
        ) : (
          <Form.Item label="확인을 위해 '삭제'를 입력해 주세요" htmlFor="delete-confirm">
            <Input id="delete-confirm" autoComplete="off" value={value} onChange={(e) => setValue(e.target.value)} />
          </Form.Item>
        )}
      </Form>
      {remove.error && <Alert type="error" title={remove.error.message} />}
    </Modal>
  );
}
