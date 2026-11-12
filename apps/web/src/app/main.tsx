// 제목과 본문 모두 Asta Sans(한글·영문) 한 벌
import '@fontsource-variable/asta-sans/index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { onSessionExpired, restoreSession } from '@/shared/api';
import { initThemeMode } from '@/shared/theme';
import '@/shared/theme/theme.css';
import { initMonitoring } from './monitoring';
import { AppProviders, queryClient } from './providers/AppProviders';
import { installNativeBridge } from './native-bridge';
import { router } from './router';

initMonitoring();
initThemeMode();

onSessionExpired(() => {
  queryClient.clear();
  void router.navigate('/login', { replace: true });
});

// 저장소를 읽지 못해도 로그인 화면으로 시작합니다.
await restoreSession().catch(() => false);

installNativeBridge();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
