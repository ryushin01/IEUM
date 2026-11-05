import type { Preview } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App, ConfigProvider } from 'antd';
import '@fontsource/stylish/400.css';
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
