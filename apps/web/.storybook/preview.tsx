import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
// 본문은 Asta Sans(한글·영문), 제목의 영문·숫자는 Lato
import '@fontsource-variable/asta-sans/index.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
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
