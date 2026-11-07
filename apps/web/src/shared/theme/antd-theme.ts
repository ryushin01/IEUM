import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

const FONT = `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;

/** theme.css.ts의 토큰과 같은 값입니다. */
const COLORS = {
  light: { primaryHover: '#0a5ec6', primaryActive: '#0952ad', errorHover: '#b81c23', errorActive: '#9c171d', primary: '#0b6be0', onPrimary: '#ffffff', text: '#2b2d38', muted: '#646a75', error: '#d3222a', surface: '#ffffff', bg: '#f5f6f8', control: '#31313b' },
  dark: { primaryHover: '#7db5ff', primaryActive: '#4a90ee', errorHover: '#ffa3a7', errorActive: '#f47378', primary: '#5ea3ff', onPrimary: '#10131a', text: '#eef0f3', muted: '#a9afba', error: '#ff8a8f', surface: '#1b1e25', bg: '#111318', control: '#a9afba' },
};

/** 브라우저 주소창 색입니다. 헤더(theme.css.ts의 header)와 같은 면 색을 씁니다. */
export function browserThemeColor(mode: ThemeMode): string {
  return COLORS[mode].surface;
}

export function antdTheme(mode: ThemeMode): ThemeConfig {
  const c = COLORS[mode];
  return {
    cssVar: { key: 'ieum' },
    algorithm: mode === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: c.primary,
      // 자동으로 만든 색은 글자 대비가 4.5:1 아래로 떨어지므로 직접 정합니다.
      colorPrimaryHover: c.primaryHover,
      colorPrimaryActive: c.primaryActive,
      colorErrorHover: c.errorHover,
      colorErrorActive: c.errorActive,
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
      fontSize: 14,
      borderRadius: 10,
      controlHeight: 44,
      motionDurationMid: '0.1s',
    },
    components: {
      Button: {
        fontWeight: 600,
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
