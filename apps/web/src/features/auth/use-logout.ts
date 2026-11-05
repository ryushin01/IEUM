import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { clearSession, getRefreshToken, request } from '@/shared/api';

export function useLogout() {
  const client = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    const refreshToken = getRefreshToken();
    // 서버 폐기가 실패해도 기기에서는 로그아웃합니다.
    await request('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
    await clearSession();
    client.clear();
    navigate('/login', { replace: true });
  };
}
