import { Link } from 'react-router';
import { Navigate, useLocation, useSearchParams } from 'react-router';
import { DemoLogin, ForgotPasswordForm, LoginForm, ResetPasswordForm, SignupForm, SocialLoginButtons, SocialSignupForm, useCompleteSocialCallback, type SocialSignupState } from '@/features/auth';
import { ErrorView, LoadingView } from '@/shared/ui';
import { usePageTitle } from '@/shared/lib';
import { Logo, srOnly } from '@/shared/ui';
import * as s from './AuthLayout.css';

export function LoginPage() {
  usePageTitle('로그인');
  return (
    <main className={s.page}>
      <div className={s.brand}>
        <h1 className={s.title}><Logo size={32} /><span className={srOnly}> 로그인</span></h1>
        <p className={s.tagline}>나와 너를 <strong className={s.taglineStrong}>잇는 공간</strong></p>
      </div>
      <DemoLogin />
      <LoginForm />
      <SocialLoginButtons />
      <p className={s.footer}>처음이신가요? <Link to="/signup">회원가입</Link></p>
      <p className={s.footer}><Link to="/forgot-password">비밀번호를 잊으셨나요?</Link></p>
    </main>
  );
}

export function SignupPage() {
  usePageTitle('회원가입');
  return (
    <main className={s.page}>
      <div className={s.subBrand}>
        <Logo size={24} />
        <h1 className={s.subTitle}>회원가입</h1>
      </div>
      <SignupForm />
      <p className={s.footer}>이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </main>
  );
}

/** 소셜 첫 로그인: 약관 동의와 닉네임을 받습니다. */
export function SocialSignupPage() {
  usePageTitle('추가 정보 입력');
  const state = useLocation().state as SocialSignupState | null;
  if (!state?.signupToken) return <Navigate to="/login" replace />;
  return (
    <main className={s.page}>
      <div className={s.subBrand}>
        <Logo size={24} />
        <h1 className={s.subTitle}>추가 정보 입력</h1>
      </div>
      <SocialSignupForm state={state} />
    </main>
  );
}

/** 브라우저에서 제공자 로그인을 마치고 돌아오는 화면입니다. 앱은 브릿지로 결과를 받습니다. */
export function AuthCallbackPage() {
  usePageTitle('로그인 처리 중');
  const [params] = useSearchParams();
  const error = useCompleteSocialCallback(params);
  return (
    <main className={s.page}>
      <h1 className={srOnly}>로그인 처리 중</h1>
      {error ? (
        <>
          <ErrorView error={error} />
          <p className={s.footer}><Link to="/login">로그인으로 돌아가기</Link></p>
        </>
      ) : <LoadingView label="로그인 처리 중" />}
    </main>
  );
}

export function ForgotPasswordPage() {
  usePageTitle('비밀번호 찾기');
  return (
    <main className={s.page}>
      <div className={s.subBrand}>
        <Logo size={24} />
        <h1 className={s.subTitle}>비밀번호 찾기</h1>
      </div>
      <ForgotPasswordForm />
      <p className={s.footer}><Link to="/login">로그인으로 돌아가기</Link></p>
    </main>
  );
}

export function ResetPasswordPage() {
  usePageTitle('새 비밀번호 설정');
  return (
    <main className={s.page}>
      <div className={s.subBrand}>
        <Logo size={24} />
        <h1 className={s.subTitle}>새 비밀번호 설정</h1>
      </div>
      <ResetPasswordForm />
    </main>
  );
}
