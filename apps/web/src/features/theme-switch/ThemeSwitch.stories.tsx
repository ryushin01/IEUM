import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeSwitch } from './ThemeSwitch';

const meta: Meta<typeof ThemeSwitch> = { title: 'features/ThemeSwitch', component: ThemeSwitch };
export default meta;
export const Default: StoryObj<typeof ThemeSwitch> = {};
