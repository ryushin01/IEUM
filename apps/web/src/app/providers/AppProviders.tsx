import { StyleProvider } from '@ant-design/cssinjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp, ConfigProvider } from 'antd';
import koKR from 'antd/locale/ko_KR';
import type { ReactNode } from 'react';
import { ApiError } from '@/shared/api';
import { antdTheme, useThemeMode } from '@/shared/theme';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
    },
  },
});

/** antd는 @layer 안에 두어 layer 밖의 vanilla-extract 스타일이 항상 이기도록 합니다. */
export function AppProviders({ children }: { children: ReactNode }) {
  const mode = useThemeMode();
  return (
    <StyleProvider layer>
      <ConfigProvider theme={antdTheme(mode)} locale={koKR}>
        <AntApp>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}
