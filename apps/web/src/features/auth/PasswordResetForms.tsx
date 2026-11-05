import { useMutation } from '@tanstack/react-query';
import { Alert, Button, Form, Input } from 'antd';
import { useState } from 'react';
import { Link } from 'react-router';
import { request } from '@/shared/api';
import * as s from './auth.css';

const PASSWORD = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,72}$/;

export function ForgotPasswordForm() {
  const send = useMutation({
    mutationFn: (data: { email: string }) =>
      request<{ demoLink?: string | null }>('/auth/password-reset/request', { method: 'POST', body: data }),
  });
  if (send.isSuccess) {
    // 가입 여부를 알려 주지 않도록 항상 같은 문구를 씁니다.
    return (
      <p className={s.notice} role="status">
        가입된 이메일이라면 비밀번호 재설정 메일을 보냈습니다. 30분 안에 메일의 링크를 열어 주세요. 메일이 보이지 않으면 스팸함을 확인해 주세요.
        {send.data?.demoLink && (
          <>
            <br />
            데모에는 메일이 없으므로 <a href={send.data.demoLink}>여기에서 재설정 화면을 열 수 있습니다.</a>
          </>
        )}
      </p>
    );
  }
  return (
    <Form<{ email: string }> layout="vertical" requiredMark={false} onFinish={(values) => { if (!send.isPending) send.mutate(values); }}>
      <Form.Item
        label="이메일"
        name="email"
        extra="카카오, 네이버, Google, Apple로 가입했다면 비밀번호가 없습니다. 해당 로그인을 이용해 주세요."
        rules={[{ required: true, type: 'email', message: '이메일을 입력해 주세요.' }]}
      >
        <Input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" />
      </Form.Item>
      {send.error && <Form.Item><Alert type="error" title={send.error.message} /></Form.Item>}
      <Button type="primary" htmlType="submit" block loading={send.isPending}>재설정 메일 받기</Button>
    </Form>
  );
}

interface ResetValues { password: string; passwordCheck: string }

/** 토큰은 주소의 # 뒤에 있으며, 읽은 뒤 주소와 방문 기록에서 지웁니다. */
function readTokenOnce(): string | null {
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (token) window.history.replaceState(null, '', window.location.pathname);
  return token;
}

export function ResetPasswordForm() {
  const [token] = useState(readTokenOnce);
  const reset = useMutation({
    mutationFn: (data: { token: string; password: string }) =>
      request('/auth/password-reset/confirm', { method: 'POST', body: data }),
  });
  if (!token) {
    return (
      <>
        <p className={s.notice} role="alert">링크가 올바르지 않습니다. 메일의 링크를 다시 열거나 새로 요청해 주세요.</p>
        <p className={s.notice}><Link to="/forgot-password">재설정 메일 다시 받기</Link></p>
      </>
    );
  }
  if (reset.isSuccess) {
    return (
      <>
        <p className={s.notice} role="status">비밀번호를 변경했습니다. 다른 기기에서는 로그아웃되었습니다. 앱에서 새 비밀번호로 로그인해 주세요.</p>
        <p className={s.notice}><Link to="/login">로그인 화면으로</Link></p>
      </>
    );
  }
  return (
    <Form<ResetValues>
      layout="vertical"
      requiredMark={false}
      onFinish={({ password }) => { if (!reset.isPending) reset.mutate({ token, password }); }}
    >
      <Form.Item
        label="새 비밀번호"
        name="password"
        extra="영문, 숫자, 특수문자(!@#$%^*+=-)를 포함해 8자 이상"
        rules={[{ required: true, pattern: PASSWORD, message: '영문, 숫자, 특수문자를 포함해 8자 이상 입력해 주세요.' }]}
      >
        <Input.Password autoComplete="new-password" visibilityToggle={false} />
      </Form.Item>
      <Form.Item
        label="새 비밀번호 확인"
        name="passwordCheck"
        dependencies={['password']}
        rules={[
          { required: true, message: '같은 비밀번호를 입력해 주세요.' },
          ({ getFieldValue }) => ({
            validator: (_, value) =>
              !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('같은 비밀번호를 입력해 주세요.')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" visibilityToggle={false} />
      </Form.Item>
      {reset.error && (
        <Form.Item>
          <Alert type="error" title={reset.error.message} />
          <p className={s.notice}><Link to="/forgot-password">재설정 메일 다시 받기</Link></p>
        </Form.Item>
      )}
      <Button type="primary" htmlType="submit" block loading={reset.isPending}>비밀번호 변경</Button>
    </Form>
  );
}
