import type { Meta, StoryObj } from '@storybook/react-vite';
import { SignupForm } from './SignupForm';

const meta: Meta<typeof SignupForm> = { title: 'features/SignupForm', component: SignupForm };
export default meta;
export const Default: StoryObj<typeof SignupForm> = {};
