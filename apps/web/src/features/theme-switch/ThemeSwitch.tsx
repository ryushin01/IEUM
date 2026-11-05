import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Switch } from 'antd';
import { setThemeMode, useThemeMode } from '@/shared/theme';
import { hitArea } from './ThemeSwitch.css';

/** sprout의 56×28 테마 토글입니다. 눌리는 영역은 CSS로 44px까지 넓힙니다. */
export function ThemeSwitch({ className }: { className?: string }) {
  const mode = useThemeMode();
  return (
    <span className={`${hitArea} ${className ?? ''}`}>
      <Switch
        aria-label="다크 모드"
        checked={mode === 'dark'}
        checkedChildren={<MoonOutlined aria-hidden="true" />}
        unCheckedChildren={<SunOutlined aria-hidden="true" />}
        onChange={(dark) => setThemeMode(dark ? 'dark' : 'light')}
      />
    </span>
  );
}
