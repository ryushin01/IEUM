import { Button, Spin } from 'antd';
import type { ReactNode } from 'react';
import { centered } from './ui.css';

export function LoadingView({ label = '불러오는 중' }: { label?: string }) {
  return (
    <div className={centered} role="status" aria-label={label}>
      <Spin size="large" />
    </div>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className={centered} role="alert">
      <p>{typeof error === 'string' ? error : error instanceof Error ? error.message : '일시적인 오류가 발생했습니다.'}</p>
      {onRetry && <Button onClick={onRetry}>다시 시도</Button>}
    </div>
  );
}

export function EmptyView({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className={centered}>
      <p>{title}</p>
      {action}
    </div>
  );
}
