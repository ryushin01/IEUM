import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

const FONT = `'Gothic A1', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;

/** theme.css.ts의 톡톡 토큰과 같은 값입니다. */
const COLORS = {
  light: { primary: '#d9252f', onPrimary: '#ffffff', text: '#1f1b1c', muted: '#625b5f', error: '#b3131d', surface: '#ffffff', bg: '#f4f4f6', control: '#8a8387' },
  dark: { primary: '#ff6b72', onPrimary: '#161314', text: '#f7f4f4', muted: '#c9c2c5', error: '#ff9db1', surface: '#262223', bg: '#161314', control: '#8f888b' },
};

export function antdTheme(mode: ThemeMode): ThemeConfig {
  const c = COLORS[mode];
  return {
    cssVar: { key: 'ieum' },
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: c.primary,
      colorTextLightSolid: c.onPrimary,
      colorLink: c.text,
      colorError: c.error,
      colorBgContainer: c.surface,
      colorBgElevated: c.surface,
      colorBgLayout: c.bg,
      colorBorder: c.control,
      // 보조 글자도 명도 대비 4.5:1을 넘깁니다.
      colorTextDescription: c.muted,
      colorTextSecondary: c.muted,
      colorTextTertiary: c.muted,
      colorTextPlaceholder: c.muted,
      fontFamily: FONT,
      fontSize: 16,
      borderRadius: 14,
      controlHeight: 48,
      motionDurationMid: '0.1s',
    },
    components: {
      Button: {
        fontWeight: 700,
        primaryShadow: 'none',
        dangerShadow: 'none',
        dangerColor: mode === 'light' ? '#ffffff' : '#161314',
        primaryColor: c.onPrimary,
        defaultHoverColor: c.primary,
        defaultHoverBorderColor: c.primary,
        defaultActiveColor: c.primary,
        defaultActiveBorderColor: c.primary,
      },
      Input: { activeBorderColor: c.text, hoverBorderColor: c.text, activeShadow: 'none' },
      Checkbox: { colorWhite: c.onPrimary },
      Radio: { dotSize: 8, colorWhite: c.onPrimary },
    },
  };
}
