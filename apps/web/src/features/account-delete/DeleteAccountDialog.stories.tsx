import type { Meta, StoryObj } from '@storybook/react-vite';
import { DeleteAccountDialog } from './DeleteAccountDialog';

const meta: Meta<typeof DeleteAccountDialog> = {
  title: 'features/DeleteAccountDialog',
  component: DeleteAccountDialog,
  args: { open: true, onClose: () => {} },
};
export default meta;
export const WithPassword: StoryObj<typeof DeleteAccountDialog> = { args: { hasPassword: true } };
export const SocialAccount: StoryObj<typeof DeleteAccountDialog> = { args: { hasPassword: false } };
