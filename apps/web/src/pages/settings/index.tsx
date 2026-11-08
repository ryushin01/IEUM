import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router';
import { DeleteAccountDialog } from '@/features/account-delete';
import { useLogout } from '@/features/auth';
import { useMe } from '@/entities/session';
import { callNative, isNativeApp } from '@/shared/bridge';
import { BASE_URL, IS_DEMO, SUPPORT_EMAIL } from '@/shared/config';
import { usePageTitle } from '@/shared/lib';
import * as s from './Settings.css';

async function resetDemoData() {
  if (import.meta.env.VITE_DEMO_MODE !== 'true') return;
  const { resetDemo } = await import('@/shared/api/demo/server');
  resetDemo();
  window.location.assign(`${BASE_URL}login`);
}

export function SettingsPage() {
  usePageTitle('설정');
  const logout = useLogout();
  const { data: me } = useMe();
  const [deleting, setDeleting] = useState(false);
  const info = useQuery({
    queryKey: ['app-info'],
    enabled: isNativeApp(),
    queryFn: () => callNative('app.getInfo'),
  });
  return (
    <div className={s.page}>
      <h1 className={s.title}>설정</h1>
      <ul>
        {me?.isAdmin && <li className={s.row}><Link className={s.action} to="/admin/reports">신고 처리</Link></li>}
        <li className={s.row}><Link className={s.action} to="/settings/blocks">차단한 사용자</Link></li>
        <li className={s.row}><Link className={s.action} to="/terms">이용약관</Link></li>
        <li className={s.row}><Link className={s.action} to="/privacy">개인정보 처리방침</Link></li>
        {SUPPORT_EMAIL && <li className={s.row}><a className={s.action} href={`mailto:${SUPPORT_EMAIL}`}>문의하기</a></li>}
        {IS_DEMO && <li className={s.row}><button type="button" className={s.action} onClick={() => void resetDemoData()}>데모 데이터 초기화</button></li>}
        <li className={s.row}><button type="button" className={s.action} onClick={() => void logout()}>로그아웃</button></li>
        <li className={s.row}><button type="button" className={s.danger} onClick={() => setDeleting(true)}>계정 삭제</button></li>
      </ul>
      {info.data && <p className={s.version}>버전 {info.data.version} ({info.data.build})</p>}
      <DeleteAccountDialog open={deleting} hasPassword={me?.hasPassword ?? true} onClose={() => setDeleting(false)} />
    </div>
  );
}
