import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
// 제목과 본문 모두 Asta Sans(한글·영문) 한 벌
import '@fontsource-variable/asta-sans/index.css';
import { MemoryRouter } from 'react-router';
import '@/shared/theme/theme.css';
import { antdTheme } from '@/shared/theme';

const preview: Preview = {
  parameters: { a11y: { test: 'error' } },
  decorators: [
    (Story) => (
      <ConfigProvider theme={antdTheme('light')}>
        <App>
          <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
            <MemoryRouter>
              <main style={{ maxWidth: 390 }}><Story /></main>
            </MemoryRouter>
          </QueryClientProvider>
        </App>
      </ConfigProvider>
    ),
  ],
};
export default preview;
