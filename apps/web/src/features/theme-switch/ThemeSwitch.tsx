import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { setThemeMode, useThemeMode } from '@/shared/theme';
import { handle, hitArea, icon, track } from './ThemeSwitch.css';

/** antd Switch는 button 안에 div를 넣어 콘텐츠 모델을 어기므로 네이티브 버튼으로 만듭니다. */
export function ThemeSwitch({ className }: { className?: string }) {
  const mode = useThemeMode();
  const dark = mode === 'dark';
  return (
    <span className={`${hitArea} ${className ?? ''}`}>
      <button
        type="button"
        role="switch"
        className={track}
        aria-label="다크 모드"
        aria-checked={dark}
        onClick={() => setThemeMode(dark ? 'light' : 'dark')}
      >
        <span className={handle} />
        <span className={icon}>{dark ? <MoonOutlined aria-hidden="true" /> : <SunOutlined aria-hidden="true" />}</span>
      </button>
    </span>
  );
}
