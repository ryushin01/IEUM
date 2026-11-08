import { Link, useNavigate } from 'react-router';
import { SUPPORT_EMAIL } from '@/shared/config';
import { usePageTitle } from '@/shared/lib';
import * as s from './Legal.css';

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <main className={s.doc}>
      <Link className={s.back} to=".." onClick={(e) => { e.preventDefault(); void navigate(-1); }}>← 뒤로 가기</Link>
      {children}
    </main>
  );
}

/** 예시 문서입니다. 실제로 출시한다면 운영 주체 정보를 채우고 법률 검토를 받아야 합니다. docs/release.md 참고 */
export function TermsPage() {
  usePageTitle('이용약관');
  return (
    <Layout>
      <h1>이용약관</h1>
      <p><strong>포트폴리오 프로젝트의 예시 문서이며 실제 서비스 약관이 아닙니다.</strong></p>
      <h2>1. 서비스</h2>
      <p>이음은 사진과 글을 공유하고 메시지를 주고받는 소셜 서비스입니다. 만 14세 이상만 이용할 수 있습니다.</p>
      <h2>2. 금지 행위</h2>
      <p>불쾌한 콘텐츠와 악의적인 이용자는 용납하지 않습니다. 다음 행위를 금지합니다.</p>
      <ul>
        <li>음란물, 폭력적이거나 혐오를 조장하는 콘텐츠 게시</li>
        <li>타인을 괴롭히거나 사칭하는 행위, 타인의 개인정보 게시</li>
        <li>스팸, 광고, 불법 정보 유포, 타인의 권리 침해</li>
      </ul>
      <h2>3. 신고와 조치</h2>
      <p>이용자는 게시글, 댓글, 사용자를 신고하거나 차단할 수 있습니다. 운영자는 신고를 검토하며, 위반 콘텐츠를 삭제하고 해당 이용자의 이용을 제한할 수 있습니다.</p>
      <h2>4. 콘텐츠의 권리</h2>
      <p>게시물의 권리는 작성자에게 있습니다. 작성자는 서비스 제공에 필요한 범위에서 게시물을 표시하도록 허락합니다.</p>
      <h2>5. 탈퇴</h2>
      <p>이용자는 설정 화면에서 언제든 계정을 삭제할 수 있습니다.</p>
      {SUPPORT_EMAIL && (
        <>
          <h2>6. 문의</h2>
          <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
        </>
      )}
    </Layout>
  );
}

export function PrivacyPage() {
  usePageTitle('개인정보 처리방침');
  return (
    <Layout>
      <h1>개인정보 처리방침</h1>
      <p><strong>포트폴리오 프로젝트의 예시 문서이며 실제 서비스 방침이 아닙니다.</strong></p>
      <h2>1. 수집 항목과 목적</h2>
      <ul>
        <li>회원 관리: 이메일, 비밀번호(암호화 저장), 닉네임</li>
        <li>소셜 로그인(카카오, 네이버, Google, Apple): 제공자의 회원 식별자, 닉네임, 제공자가 확인한 이메일(Apple은 가린 이메일 포함), Apple 연결 해제용 토큰(암호화 저장, 탈퇴 시 폐기)</li>
        <li>서비스 제공: 프로필 사진과 소개, 게시글·사진·댓글, 메시지, 좋아요, 차단·신고 기록</li>
        <li>보안과 장애 대응: 접속 IP, 접속 기록</li>
        <li>비밀번호 재설정: 이메일 (재설정 링크 발송)</li>
      </ul>
      <h2>2. 보유 기간</h2>
      <p>계정을 삭제하면 프로필, 게시글, 댓글, 메시지를 바로 삭제합니다. 법령에 보관 의무가 있는 정보는 해당 기간 동안 보관합니다. 신고 기록은 작성자 정보를 분리한 뒤 처리 이력으로 남길 수 있습니다.</p>
      <p>올린 사진의 위치 정보 등 메타데이터는 서버에서 지운 뒤 저장합니다.</p>
      <h2>3. 제3자 제공과 위탁</h2>
      <p>이용자 동의나 법령에 근거가 없으면 제3자에게 제공하지 않습니다. 광고나 추적 목적으로 정보를 사용하지 않습니다. 메일 발송과 사진 저장을 외부 업체에 위탁할 수 있으며, 위탁 업체는 출시 전에 이 방침에 기재합니다.</p>
      <h2>4. 기기 권한</h2>
      <ul>
        <li>사진 보관함: 게시글과 프로필에 올릴 사진 선택 (선택 권한)</li>
        <li>카메라: 게시글에 올릴 사진 촬영 (선택 권한)</li>
      </ul>
      <h2>5. 이용자의 권리</h2>
      <p>프로필과 게시글은 앱에서 직접 열람·수정·삭제할 수 있고, 계정은 설정 &gt; 계정 삭제에서 삭제할 수 있습니다.</p>
      {SUPPORT_EMAIL && (
        <>
          <h2>6. 개인정보 보호 책임자</h2>
          <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
        </>
      )}
    </Layout>
  );
}
