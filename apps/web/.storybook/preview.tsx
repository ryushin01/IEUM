import type { Preview } from '@storybook/react-vite';
import { ConfigProvider } from 'antd';
import '@fontsource/stylish/400.css';
import '@/shared/theme/theme.css';
import { antdTheme } from '@/shared/theme';

const preview: Preview = {
  parameters: { a11y: { test: 'error' } },
  decorators: [(Story) => <ConfigProvider theme={antdTheme('light')}><Story /></ConfigProvider>],
};
export default preview;
