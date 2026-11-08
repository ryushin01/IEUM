import { logo, logoMark } from './ui.css';

/** 넓은 비례로 직접 그린 IEUM 로고입니다. 앱의 lib/app/wordmark.dart와 같은 도형입니다. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg className={logo} style={{ fontSize: size }} viewBox="0 0 425 100" role="img" aria-label="IEUM">
      <path d="M0 0h18v100H0zM34 0h96v16H52v26h71v16H52v26h78v16H34zM146 0h18v60c0 16 13 25 33 25s33-9 33-25V0h18v60c0 26-20 40-51 40s-51-14-51-40zM264 0h25l35 76 35-76h25v100h-18V31l-33 69h-18l-33-69v69h-18z" />
      <circle className={logoMark} cx="412" cy="87" r="13" />
    </svg>
  );
}
