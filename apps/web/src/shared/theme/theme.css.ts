import { createGlobalThemeContract, createGlobalTheme, globalStyle } from '@vanilla-extract/css';

export const vars = createGlobalThemeContract({
  color: {
    bg: 'bg', surface: 'surface', text: 'text', muted: 'muted', border: 'border', control: 'control',
    primary: 'primary', onPrimary: 'on-primary',
    ink: 'ink', onInk: 'on-ink',
    accentSoft: 'accent-soft', onAccentSoft: 'on-accent-soft',
    header: 'header', onHeader: 'on-header',
    like: 'like', official: 'official', error: 'error', focus: 'focus',
    avatarBg: 'avatar-bg', onAvatar: 'on-avatar',
    bubbleOther: 'bubble-other',
  },
  layout: { header: 'header', nav: 'nav', content: 'content', band: 'band' },
}, (_, path) => `ieum-${path.join('-')}`);

const layout = { header: '56px', nav: '64px', content: '614px', band: '8px' };

/** 카닥 앱을 참고한 디자인 토큰입니다. Flutter의 lib/app/theme.dart와 같은 값을 유지하고, 글자는 배경과 4.5:1 이상을 맞춥니다. */
createGlobalTheme(':root, [data-theme="light"]', vars, {
  color: {
    bg: '#f5f6f8', surface: '#ffffff', text: '#2b2d38', muted: '#646a75', border: '#e3e5e9', control: '#8a8f98',
    primary: '#0b6be0', onPrimary: '#ffffff',
    ink: '#31313b', onInk: '#ffffff',
    accentSoft: '#e8f1fd', onAccentSoft: '#0a4fa8',
    header: '#ffffff', onHeader: '#2b2d38',
    like: '#0b6be0', official: '#0b6be0', error: '#d3222a', focus: '#2b2d38',
    avatarBg: '#ccd1d4', onAvatar: '#2b2d38',
    bubbleOther: '#f0f1f4',
  },
  layout,
});

createGlobalTheme('[data-theme="dark"]', vars, {
  color: {
    bg: '#111318', surface: '#1b1e25', text: '#eef0f3', muted: '#a9afba', border: '#343843', control: '#7f8693',
    primary: '#5ea3ff', onPrimary: '#10131a',
    ink: '#eef0f3', onInk: '#1b1e25',
    accentSoft: '#1c2d47', onAccentSoft: '#b9d6ff',
    header: '#1b1e25', onHeader: '#eef0f3',
    like: '#5ea3ff', official: '#5ea3ff', error: '#ff8a8f', focus: '#eef0f3',
    avatarBg: '#3a3f4a', onAvatar: '#eef0f3',
    bubbleOther: '#2a2e37',
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
globalStyle('input.ant-input, textarea.ant-input', { '@media': { '(pointer: coarse)': { fontSize: 16 } } });
globalStyle('input.ant-input:focus-visible, textarea.ant-input:focus-visible', { outlineOffset: -1 });
// 비밀번호 칸은 바깥 틀이 초점을 표시하므로 안쪽 입력에 테두리를 겹치지 않습니다.
globalStyle('.ant-input-affix-wrapper input.ant-input:focus-visible', { outline: 'none' });
globalStyle('.ant-input-affix-wrapper:focus-within', { outline: `2px solid ${vars.color.focus}`, outlineOffset: -1 });
