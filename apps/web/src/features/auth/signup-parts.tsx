import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, App, Button, Checkbox, Form, Input, type FormInstance } from 'antd';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { setMe, type Me } from '@/entities/session';
import { imageErrorMessage, pickAndUploadImages, request } from '@/shared/api';
import completeData from '@/shared/assets/lottie/complete.json';
import { LottieImage, UserAvatar } from '@/shared/ui';
import * as s from './auth.css';

const NICKNAME = /^[\p{L}\p{N}_.]{2,20}$/u;

const mustCheck = (message: string) => ({
  validator: (_: unknown, value: boolean) => (value ? Promise.resolve() : Promise.reject(new Error(message))),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 이메일 가입과 소셜 가입 양식을 함께 받습니다.
export function NicknameField({ form }: { form: FormInstance<any> }) {
  const [state, setState] = useState<{ value: string; available: boolean } | null>(null);
  const nickname: string = Form.useWatch('nickname', form) ?? '';
  const check = useMutation({
    mutationFn: (value: string) =>
      request<{ available: boolean }>(`/auth/nickname-available?nickname=${encodeURIComponent(value)}`),
    onSuccess: ({ available }, value) => setState({ value, available }),
  });
  const checked = state?.value === nickname ? state : null;
  return (
    <>
      <Form.Item
        label="닉네임"
        required
        htmlFor="signup-nickname"
        extra={checked ? (checked.available ? '사용할 수 있는 닉네임입니다.' : '이미 사용 중인 닉네임입니다.') : '2~20자의 글자, 숫자, 밑줄, 마침표'}
      >
        <div className={s.inline}>
          <Form.Item noStyle name="nickname" rules={[{ required: true, pattern: NICKNAME, message: '닉네임 형식을 확인해 주세요.' }]}>
            <Input id="signup-nickname" autoComplete="nickname" maxLength={20} />
          </Form.Item>
          <Button
            loading={check.isPending}
            disabled={!NICKNAME.test(nickname)}
            onClick={() => { if (!check.isPending) check.mutate(nickname); }}
          >
            중복 확인
          </Button>
        </div>
      </Form.Item>
      {check.error && <Form.Item><Alert type="error" title={check.error.message} /></Form.Item>}
    </>
  );
}

export function ConsentFields() {
  return (
    <>
      <Form.Item name="confirmAge" valuePropName="checked" rules={[mustCheck('만 14세 이상만 가입할 수 있습니다.')]}>
        <Checkbox>만 14세 이상입니다.</Checkbox>
      </Form.Item>
      <Form.Item name="agreeTerms" valuePropName="checked" rules={[mustCheck('약관과 개인정보 처리방침에 동의해 주세요.')]} extra={<><Link to="/terms">이용약관</Link> · <Link to="/privacy">개인정보 처리방침</Link> 보기</>}>
        <Checkbox>이용약관과 개인정보 처리방침에 동의합니다. 불쾌한 콘텐츠와 괴롭힘은 허용되지 않습니다.</Checkbox>
      </Form.Item>
    </>
  );
}

/** 사진 업로드에는 로그인이 필요하므로 계정을 만든 뒤에 받습니다. */
export function SignupComplete({ me }: { me: Me }) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const { message } = App.useApp();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const choose = async () => {
    setUploading(true);
    try {
      const [url] = await pickAndUploadImages('gallery', 1);
      if (url) {
        setMe(client, await request<Me>('/me', { method: 'PATCH', body: { avatarUrl: url } }));
        setAvatarUrl(url);
      }
    } catch (error) {
      void message.error(imageErrorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={s.complete}>
      <LottieImage data={completeData} loop={false} />
      <p role="status">회원 가입이 완료되었습니다.</p>
      <UserAvatar nickname={me.nickname} src={avatarUrl} size={72} decorative={false} />
      <Button block loading={uploading} onClick={() => void choose()}>프로필 사진 선택 (선택 사항)</Button>
      <Button type="primary" block onClick={() => void navigate('/', { replace: true })}>시작하기</Button>
    </div>
  );
}
