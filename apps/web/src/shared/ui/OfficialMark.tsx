import { CheckCircleFilled } from '@ant-design/icons';
import { official, srOnly } from './ui.css';

export function OfficialMark() {
  return (
    <span className={official}>
      <CheckCircleFilled aria-hidden="true" />
      <span className={srOnly}>공식 계정</span>
    </span>
  );
}
