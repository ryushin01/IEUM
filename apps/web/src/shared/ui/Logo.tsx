import { logo, logoMark } from './ui.css';

/** IEUM 타이포그래피 로고입니다. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className={logo} style={{ fontSize: size }}>
      IEUM
      <span className={logoMark} aria-hidden="true" />
    </span>
  );
}
