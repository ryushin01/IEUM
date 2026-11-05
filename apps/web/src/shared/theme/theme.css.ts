import { createGlobalThemeContract, createGlobalTheme, globalStyle } from '@vanilla-extract/css';

export const vars = createGlobalThemeContract({
  color: {
    bg: 'bg', surface: 'surface', text: 'text', muted: 'muted', border: 'border',
    primary: 'primary', onPrimary: 'on-primary', primaryStrong: 'primary-strong',
    accent: 'accent', accentSoft: 'accent-soft', onAccentSoft: 'on-accent-soft',
    header: 'header', onHeader: 'on-header',
    like: 'like', likeSoft: 'like-soft', official: 'official', error: 'error', focus: 'focus',
    bubbleOther: 'bubble-other', shadow: 'shadow',
  },
  layout: { header: 'header', nav: 'nav', content: 'content' },
}, (_, path) => `ieum-${path.join('-')}`);

const layout = { header: '52px', nav: '72px', content: '614px' };

/** 톡톡 디자인 토큰입니다. Flutter의 lib/app/theme.dart와 같은 값을 유지하고, 글자는 배경과 4.5:1 이상을 맞춥니다. */
createGlobalTheme(':root, [data-theme="light"]', vars, {
  color: {
    bg: '#f4f4f6', surface: '#ffffff', text: '#1f1b1c', muted: '#625b5f', border: '#dedbdd',
    primary: '#d9252f', onPrimary: '#ffffff', primaryStrong: '#9e1019',
    accent: '#c4e538', accentSoft: '#eaf6c2', onAccentSoft: '#2f3a00',
    header: '#d9252f', onHeader: '#ffffff',
    like: '#b3131d', likeSoft: '#ffe9ea', official: '#1f6fc4', error: '#b3131d', focus: '#1f1b1c',
    bubbleOther: '#ffffff', shadow: 'rgba(31, 27, 28, 0.08)',
  },
  layout,
});

createGlobalTheme('[data-theme="dark"]', vars, {
  color: {
    bg: '#161314', surface: '#262223', text: '#f7f4f4', muted: '#c9c2c5', border: '#4a4446',
    primary: '#ff6b72', onPrimary: '#161314', primaryStrong: '#a83a40',
    accent: '#c4e538', accentSoft: '#39401a', onAccentSoft: '#e4f39a',
    header: '#2a1416', onHeader: '#f7f4f4',
    like: '#ffc2c5', likeSoft: '#4a2024', official: '#6fb4f5', error: '#ff9db1', focus: '#ff9ca1',
    bubbleOther: '#3a3536', shadow: 'rgba(0, 0, 0, 0)',
  },
  layout,
});

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
globalStyle('html, body', {
  margin: 0,
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  fontFamily: `'Gothic A1', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`,
  fontSize: 16,
  lineHeight: 1.5,
  // 한글이 단어 중간에서 끊기지 않게 하되, 긴 문자열은 넘치지 않게 합니다.
  wordBreak: 'keep-all',
  overflowWrap: 'anywhere',
  WebkitTextSizeAdjust: '100%',
  overscrollBehaviorY: 'none',
});
globalStyle('h1, h2, h3, p, ul, ol, figure', { margin: 0, padding: 0 });
globalStyle('ul, ol', { listStyle: 'none' });
globalStyle('img', { display: 'block', maxWidth: '100%' });
globalStyle('a', { color: 'inherit' });
// 본문 속 링크는 색만으로 구분하지 않습니다. (KWCAG 5.4.1)
globalStyle('a:not([class])', { color: vars.color.text, textDecoration: 'underline' });
// KWCAG 6.1.3: 아이콘 버튼과 체크 항목의 조작 영역을 44px 이상으로 맞춥니다.
globalStyle('.ant-btn', { minWidth: 44 });
// 아이콘 버튼만 줄어들지 않게 합니다. 폭 100% 버튼까지 막으면 줄이 넘칩니다.
globalStyle('.ant-btn-icon-only', { flexShrink: 0 });
// 주요 버튼은 눌리는 느낌을 주는 입체 그림자를 씁니다.
globalStyle('.ant-btn-primary:not(:disabled):not(.ant-btn-dangerous)', { boxShadow: `0 3px 0 ${vars.color.primaryStrong}` });
globalStyle('.ant-btn-primary:not(:disabled):not(.ant-btn-dangerous):active', { boxShadow: `0 1px 0 ${vars.color.primaryStrong}`, transform: 'translateY(2px)' });
globalStyle('.ant-checkbox-wrapper, .ant-radio-wrapper', { minHeight: 44, alignItems: 'center' });
globalStyle(':focus-visible', { outline: `2px solid ${vars.color.focus}`, outlineOffset: 2 });
globalStyle('input.ant-input:focus-visible, textarea.ant-input:focus-visible', { outlineOffset: -1 });
// 비밀번호 칸은 바깥 틀이 초점을 표시하므로 안쪽 입력에 테두리를 겹치지 않습니다.
globalStyle('.ant-input-affix-wrapper input.ant-input:focus-visible', { outline: 'none' });
globalStyle('.ant-input-affix-wrapper:focus-within', { outline: `2px solid ${vars.color.focus}`, outlineOffset: -1 });
