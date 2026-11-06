import type { Meta, StoryObj } from '@storybook/react-vite';
import { Form } from 'antd';
import { ConsentFields, NicknameField, SignupComplete } from './signup-parts';

const me = { id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false };

function Nickname() {
  const [form] = Form.useForm();
  return <Form form={form} layout="vertical"><NicknameField form={form} /></Form>;
}

const meta: Meta = { title: 'features/SignupParts' };
export default meta;
export const NicknameInput: StoryObj = { render: () => <Nickname /> };
export const Consent: StoryObj = { render: () => <Form layout="vertical"><ConsentFields /></Form> };
export const Complete: StoryObj = { render: () => <SignupComplete me={me} /> };
