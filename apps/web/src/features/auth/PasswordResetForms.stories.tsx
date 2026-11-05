import type { Meta, StoryObj } from '@storybook/react-vite';
import { ForgotPasswordForm, ResetPasswordForm } from './PasswordResetForms';

const meta: Meta = { title: 'features/PasswordResetForms' };
export default meta;
export const Forgot: StoryObj = { render: () => <ForgotPasswordForm /> };
// 토큰이 없을 때의 안내입니다.
export const ResetWithoutToken: StoryObj = { render: () => <ResetPasswordForm /> };
