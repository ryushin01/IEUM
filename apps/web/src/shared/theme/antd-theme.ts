import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

const FONT = `'Gothic A1', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;

/** theme.css.ts의 토큰과 같은 값입니다. */
const COLORS = {
  light: { primary: '#0b6be0', onPrimary: '#ffffff', text: '#2b2d38', muted: '#646a75', error: '#d3222a', surface: '#ffffff', bg: '#f5f6f8', control: '#31313b' },
  dark: { primary: '#5ea3ff', onPrimary: '#10131a', text: '#eef0f3', muted: '#a9afba', error: '#ff8a8f', surface: '#1b1e25', bg: '#111318', control: '#a9afba' },
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
      borderRadius: 10,
      controlHeight: 48,
      motionDurationMid: '0.1s',
    },
    components: {
      Button: {
        fontWeight: 700,
        primaryShadow: 'none',
        dangerShadow: 'none',
        dangerColor: mode === 'light' ? '#ffffff' : '#10131a',
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
