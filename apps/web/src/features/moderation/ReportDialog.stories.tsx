import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportDialog } from './ReportDialog';

const meta: Meta<typeof ReportDialog> = {
  title: 'features/ReportDialog',
  component: ReportDialog,
  args: { target: { type: 'post', id: 'p1' }, onClose: () => {} },
};
export default meta;
export const Open: StoryObj<typeof ReportDialog> = {};
