import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

const FONT = `'Stylish', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
const INK = '#222222';
const LIME = '#c4e538';

/** 라임 위에는 흰 글자의 대비가 부족하므로 어두운 글자를 씁니다. */
export function antdTheme(mode: ThemeMode): ThemeConfig {
  const strong = mode === 'light' ? INK : LIME;
  const muted = mode === 'light' ? '#666666' : '#cccccc';
  return {
    cssVar: { key: 'ieum' },
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: LIME,
      colorTextLightSolid: INK,
      colorLink: mode === 'light' ? INK : LIME,
      colorError: mode === 'light' ? '#bb2649' : '#ff9db1',
      colorBgContainer: mode === 'light' ? '#ffffff' : '#2c2c2c',
      colorBgElevated: mode === 'light' ? '#ffffff' : '#2c2c2c',
      colorBgLayout: mode === 'light' ? '#ffffff' : '#222222',
      // 보조 글자도 명도 대비 4.5:1을 넘깁니다.
      colorTextDescription: muted,
      colorTextSecondary: muted,
      colorTextTertiary: muted,
      colorTextPlaceholder: muted,
      fontFamily: FONT,
      fontSize: 16,
      borderRadius: 4,
      controlHeight: 44,
      motionDurationMid: '0.1s',
    },
    components: {
      Button: { primaryColor: INK, defaultHoverColor: strong, defaultHoverBorderColor: strong, defaultActiveColor: strong, defaultActiveBorderColor: strong },
      Input: { activeBorderColor: strong, hoverBorderColor: strong, activeShadow: 'none' },
      Switch: { trackHeight: 28, trackMinWidth: 56, handleSize: 20, colorPrimary: LIME, colorPrimaryHover: LIME, colorTextQuaternary: '#666666', colorTextTertiary: '#555555' },
      Checkbox: { colorWhite: INK },
      Radio: { dotSize: 8, colorWhite: INK },
    },
  };
}
