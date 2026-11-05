import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { clearSession, getRefreshToken, request, restoreSession } from '@/shared/api';

export function useLogout() {
  const client = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    // 앱은 토큰을 따로 재발급하므로, 폐기할 최신 토큰을 저장소에서 다시 읽습니다.
    await restoreSession().catch(() => false);
    const refreshToken = getRefreshToken();
    // 서버 폐기가 실패해도 기기에서는 로그아웃합니다.
    await request('/auth/logout', { method: 'POST', body: { refreshToken } }).catch(() => {});
    await clearSession();
    client.clear();
    navigate('/login', { replace: true });
  };
}
