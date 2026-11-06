import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Form } from 'antd';
import { afterEach, expect, it, vi } from 'vitest';
import { stubApi, TestProviders } from '@/shared/lib/test-providers';
import { ConsentFields, NicknameField, SignupComplete } from './signup-parts';

afterEach(() => vi.unstubAllGlobals());

function Nickname() {
  const [form] = Form.useForm();
  return <Form form={form}><NicknameField form={form} /></Form>;
}
const check = () => screen.getByRole('button', { name: '중복 확인' });

it('형식이 맞아야 중복을 확인할 수 있고, 결과를 안내한다', async () => {
  const calls = stubApi({ 'GET /auth/nickname-available': { available: false } });
  render(<TestProviders><Nickname /></TestProviders>);
  const input = screen.getByLabelText('닉네임');
  fireEvent.change(input, { target: { value: 'a' } });
  expect(check()).toBeDisabled();
  fireEvent.change(input, { target: { value: '새싹' } });
  await userEvent.click(check());
  expect(await screen.findByText('이미 사용 중인 닉네임입니다.')).toBeInTheDocument();
  expect(calls).toHaveLength(1);
  // 값을 바꾸면 이전 결과를 지웁니다.
  fireEvent.change(input, { target: { value: '새싹2' } });
  expect(await screen.findByText('2~20자의 글자, 숫자, 밑줄, 마침표')).toBeInTheDocument();
});

it('사용할 수 있는 닉네임을 안내한다', async () => {
  stubApi({ 'GET /auth/nickname-available': { available: true } });
  render(<TestProviders><Nickname /></TestProviders>);
  fireEvent.change(screen.getByLabelText('닉네임'), { target: { value: '새싹' } });
  await userEvent.click(check());
  expect(await screen.findByText('사용할 수 있는 닉네임입니다.')).toBeInTheDocument();
});

it('약관과 나이에 동의해야 통과하고, 약관을 볼 수 있다', async () => {
  const onFinish = vi.fn();
  render(<TestProviders><Form onFinish={onFinish}><ConsentFields /><Button htmlType="submit">확인</Button></Form></TestProviders>);
  expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
  expect(screen.getByRole('link', { name: '개인정보 처리방침' })).toHaveAttribute('href', '/privacy');
  await userEvent.click(screen.getByRole('button', { name: /확인/ }));
  expect(await screen.findByText('만 14세 이상만 가입할 수 있습니다.')).toBeInTheDocument();
  expect(await screen.findByText('약관과 개인정보 처리방침에 동의해 주세요.')).toBeInTheDocument();
  expect(onFinish).not.toHaveBeenCalled();
});

it('완료 화면은 결과를 알리고 시작 버튼을 보여 준다', () => {
  render(<TestProviders><SignupComplete me={{ id: 'me', email: 'a@example.com', hasPassword: true, isAdmin: false, nickname: '이음데모', bio: '소개', avatarUrl: null, interests: ['trip'], isOfficial: false }} /></TestProviders>);
  expect(screen.getByRole('status')).toHaveTextContent('회원 가입이 완료되었습니다.');
  expect(screen.getByRole('img', { name: '이음데모 님의 프로필 사진' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '시작하기' })).toBeEnabled();
});
