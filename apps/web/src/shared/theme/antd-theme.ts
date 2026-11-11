import { theme, type ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

const FONT = `'Asta Sans Variable', -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', sans-serif`;

/** theme.css.ts의 토큰과 같은 값입니다. */
const COLORS = {
  light: { primaryHover: '#2c2e33', primaryActive: '#3f4147', errorHover: '#b81c23', errorActive: '#9c171d', primary: '#111214', onPrimary: '#ffffff', text: '#111214', muted: '#62656e', error: '#d3222a', surface: '#ffffff', elevated: '#ffffff', bg: '#ffffff', control: '#8a8d96' },
  dark: { primaryHover: '#d9dadd', primaryActive: '#bfc1c6', errorHover: '#ff8a7f', errorActive: '#f0574a', primary: '#ffffff', onPrimary: '#111214', text: '#f4f5f7', muted: '#9a9da6', error: '#ff6b5e', surface: '#111214', elevated: '#24262c', bg: '#111214', control: '#6f727b' },
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
      colorBgElevated: c.elevated,
      colorBgLayout: c.bg,
      colorBorder: c.control,
      // 보조 글자도 명도 대비 4.5:1을 넘깁니다.
      colorTextDescription: c.muted,
      colorTextSecondary: c.muted,
      colorTextTertiary: c.muted,
      colorTextPlaceholder: c.muted,
      fontFamily: FONT,
      fontSize: 14,
      borderRadius: 8,
      controlHeight: 44,
      motionDurationMid: '0.1s',
    },
    components: {
      Button: {
        // 다크 알고리즘이 흰색을 회색으로 바꾸므로 버튼의 면 색을 직접 고정합니다.
        colorPrimary: c.primary,
        colorPrimaryHover: c.primaryHover,
        colorPrimaryActive: c.primaryActive,
        fontWeight: 600,
        primaryShadow: 'none',
        dangerShadow: 'none',
        dangerColor: mode === 'light' ? '#ffffff' : '#111214',
        primaryColor: c.onPrimary,
        defaultHoverColor: c.primary,
        defaultHoverBorderColor: c.primary,
        defaultActiveColor: c.primary,
        defaultActiveBorderColor: c.primary,
      },
      Input: { activeBorderColor: c.text, hoverBorderColor: c.text, activeShadow: 'none' },
      Tabs: { itemColor: c.muted, itemSelectedColor: c.text, itemHoverColor: c.text, itemActiveColor: c.text, inkBarColor: c.text, horizontalMargin: '0 16px', horizontalItemGutter: 0, titleFontSize: 15 },
      Form: { verticalLabelPadding: '0' },
      Checkbox: { colorWhite: c.onPrimary },
      Radio: { dotSize: 8, colorWhite: c.onPrimary },
    },
  };
}
