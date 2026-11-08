import { createGlobalThemeContract, createGlobalTheme, globalStyle } from '@vanilla-extract/css';

export const vars = createGlobalThemeContract({
  color: {
    bg: 'bg', surface: 'surface', elevated: 'elevated', text: 'text', muted: 'muted', border: 'border', control: 'control',
    primary: 'primary', onPrimary: 'on-primary',
    accent: 'accent', onAccent: 'on-accent',
    accentSoft: 'accent-soft', onAccentSoft: 'on-accent-soft',
    header: 'header', onHeader: 'on-header',
    like: 'like', official: 'official', error: 'error', focus: 'focus',
    avatarBg: 'avatar-bg', onAvatar: 'on-avatar',
    bubbleOther: 'bubble-other',
  },
  layout: { header: 'header', nav: 'nav', content: 'content', band: 'band' },
}, (_, path) => `ieum-${path.join('-')}`);

const layout = { header: '56px', nav: '64px', content: '614px', band: '8px' };

/**
 * 닷슬래시대시 앱을 참고한 단색 디자인 토큰입니다. 면은 하나로 평평하게 두고 파랑은 한 화면의 강조에만 씁니다.
 * Flutter의 lib/app/theme.dart와 같은 값을 유지하고, 글자는 배경과 4.5:1 이상을 맞춥니다.
 */
createGlobalTheme(':root, [data-theme="light"]', vars, {
  color: {
    bg: '#ffffff', surface: '#ffffff', elevated: '#ffffff', text: '#111214', muted: '#62656e', border: '#e6e7ea', control: '#8a8d96',
    primary: '#111214', onPrimary: '#ffffff',
    accent: '#1a1aff', onAccent: '#ffffff',
    accentSoft: '#f0f1f3', onAccentSoft: '#111214',
    header: '#ffffff', onHeader: '#111214',
    like: '#1a1aff', official: '#1a1aff', error: '#d3222a', focus: '#111214',
    avatarBg: '#ebecef', onAvatar: '#111214',
    bubbleOther: '#f0f1f3',
  },
  layout,
});

createGlobalTheme('[data-theme="dark"]', vars, {
  color: {
    bg: '#111214', surface: '#111214', elevated: '#24262c', text: '#f4f5f7', muted: '#9a9da6', border: '#2a2c32', control: '#6f727b',
    primary: '#ffffff', onPrimary: '#111214',
    accent: '#4545ff', onAccent: '#ffffff',
    accentSoft: '#24262c', onAccentSoft: '#f4f5f7',
    header: '#111214', onHeader: '#f4f5f7',
    like: '#9d9dff', official: '#9d9dff', error: '#ff6b5e', focus: '#ffffff',
    avatarBg: '#2a2c32', onAvatar: '#f4f5f7',
    bubbleOther: '#24262c',
  },
  layout,
});

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
globalStyle('html, body', {
  margin: 0,
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  fontFamily: `'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`,
  fontSize: 14,
  letterSpacing: '-0.01em',
  lineHeight: 1.5,
  // 한글이 단어 중간에서 끊기지 않게 하되, 긴 문자열은 넘치지 않게 합니다.
  wordBreak: 'keep-all',
  overflowWrap: 'anywhere',
  WebkitTextSizeAdjust: '100%',
  overscrollBehaviorY: 'none',
});
// KWCAG 6.1.2: 키보드로 옮긴 초점이 고정된 헤더와 하단 메뉴에 가리지 않게 합니다.
globalStyle('html', {
  scrollPaddingTop: `calc(${vars.layout.header} + 8px)`,
  scrollPaddingBottom: `calc(${vars.layout.nav} + 8px)`,
  '@media': { 'screen and (min-width: 768px)': { scrollPaddingTop: 8, scrollPaddingBottom: 8 } },
});
globalStyle('h1, h2, h3, p, ul, ol, figure', { margin: 0, padding: 0 });
globalStyle('ul, ol', { listStyle: 'none' });
globalStyle('button, input, textarea, select', { letterSpacing: 'inherit' });
globalStyle('img', { display: 'block', maxWidth: '100%' });
globalStyle('a', { color: 'inherit' });
// 본문 속 링크는 색만으로 구분하지 않습니다. (KWCAG 5.4.1)
globalStyle('a:not([class])', { color: vars.color.text, textDecoration: 'underline' });
// KWCAG 6.1.3: 아이콘 버튼과 체크 항목의 조작 영역을 44px 이상으로 맞춥니다.
globalStyle('.ant-btn', { minWidth: 44 });
// 아이콘 버튼만 줄어들지 않게 합니다. 폭 100% 버튼까지 막으면 줄이 넘칩니다.
globalStyle('.ant-btn-icon-only', { flexShrink: 0 });
globalStyle('.ant-checkbox-wrapper, .ant-radio-wrapper', { minHeight: 44, alignItems: 'center' });
globalStyle(':focus-visible', { outline: `2px solid ${vars.color.focus}`, outlineOffset: 2 });
// iOS는 16px보다 작은 입력칸에 초점이 가면 화면을 확대하므로 터치 기기에서는 입력 글자만 16px로 둡니다.
globalStyle('input.ant-input, textarea.ant-input', { '@media': { '(any-pointer: coarse)': { fontSize: 16 } } });
// 밑줄형 입력칸은 초점을 받으면 밑줄을 2px로 굵혀 표시합니다. (KWCAG 6.1.2)
globalStyle('.ant-input-underlined', { paddingInline: 0 });
globalStyle('.ant-input-underlined:focus-visible, .ant-input-underlined:focus-within', { outline: 'none', boxShadow: `inset 0 -2px 0 ${vars.color.focus}` });
globalStyle('.ant-input-underlined input.ant-input:focus-visible', { outline: 'none' });
// 폭 전체를 쓰는 주요 버튼은 글자를 왼쪽에, 긴 화살표를 오른쪽에 둡니다. 화살표는 꾸밈이라 낭독되지 않습니다.
globalStyle('.ant-btn-primary.ant-btn-block', { justifyContent: 'space-between', paddingInline: 20 });
globalStyle('.ant-btn-primary.ant-btn-block::after', {
  content: '""', width: 34, height: 10, flexShrink: 0, backgroundColor: 'currentColor',
  // 오래된 안드로이드 웹뷰는 접두사가 붙은 속성만 지원해, 없으면 화살표가 사각형으로 그려집니다.
  WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 10'%3E%3Cpath d='M0 9h32L24 1' fill='none' stroke='%23000' stroke-width='1.2'/%3E%3C/svg%3E")`, WebkitMaskRepeat: 'no-repeat', WebkitMaskSize: 'contain',
  maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 34 10'%3E%3Cpath d='M0 9h32L24 1' fill='none' stroke='%23000' stroke-width='1.2'/%3E%3C/svg%3E")`, maskRepeat: 'no-repeat', maskSize: 'contain',
});
// 비밀번호 칸은 바깥 틀이 초점을 표시하므로 안쪽 입력에 테두리를 겹치지 않습니다.
globalStyle('.ant-input-affix-wrapper input.ant-input:focus-visible', { outline: 'none' });
