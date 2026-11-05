import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './Logo';

const meta: Meta<typeof Logo> = { title: 'shared/Logo', component: Logo };
export default meta;
export const Default: StoryObj<typeof Logo> = {};
export const Large: StoryObj<typeof Logo> = { args: { size: 72 } };
