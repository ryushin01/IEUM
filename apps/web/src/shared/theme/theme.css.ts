import { createGlobalThemeContract, createGlobalTheme, globalStyle } from '@vanilla-extract/css';

export const vars = createGlobalThemeContract({
  color: {
    bg: 'bg', surface: 'surface', text: 'text', muted: 'muted', border: 'border',
    primary: 'primary', onPrimary: 'on-primary', like: 'like', error: 'error', focus: 'focus',
    bubbleOther: 'bubble-other',
  },
  layout: { header: 'header', nav: 'nav', content: 'content' },
}, (_, path) => `ieum-${path.join('-')}`);

const layout = { header: '52px', nav: '56px', content: '614px' };

/** sprout의 그레이스케일과 라임을 기준으로, 본문 대비 4.5:1을 넘기도록 보조 글자색만 조정했습니다. */
createGlobalTheme(':root, [data-theme="light"]', vars, {
  color: {
    bg: '#ffffff', surface: '#fafafa', text: '#222222', muted: '#666666', border: '#e0e0e0',
    primary: '#c4e538', onPrimary: '#222222', like: '#d63a2a', error: '#bb2649', focus: '#222222',
    bubbleOther: '#f0f0f0',
  },
  layout,
});

createGlobalTheme('[data-theme="dark"]', vars, {
  color: {
    bg: '#222222', surface: '#2c2c2c', text: '#ffffff', muted: '#cccccc', border: '#4d4d4d',
    primary: '#c4e538', onPrimary: '#222222', like: '#ff7b6b', error: '#ff9db1', focus: '#c4e538',
    bubbleOther: '#3a3a3a',
  },
  layout,
});

globalStyle('*, *::before, *::after', { boxSizing: 'border-box' });
globalStyle('html, body', {
  margin: 0,
  backgroundColor: vars.color.bg,
  color: vars.color.text,
  fontFamily: `'Stylish', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`,
  fontSize: 16,
  lineHeight: 1.5,
  WebkitTextSizeAdjust: '100%',
  overscrollBehaviorY: 'none',
});
globalStyle('h1, h2, h3, p, ul, ol, figure', { margin: 0, padding: 0 });
globalStyle('ul, ol', { listStyle: 'none' });
globalStyle('img', { display: 'block', maxWidth: '100%' });
globalStyle('a', { color: 'inherit' });
// 본문 속 링크는 색만으로 구분하지 않습니다. (KWCAG 5.4.1)
globalStyle('a:not([class])', { color: vars.color.text, textDecoration: 'underline' });
globalStyle(':focus-visible', { outline: `2px solid ${vars.color.focus}`, outlineOffset: 2 });
globalStyle('input.ant-input:focus-visible, textarea.ant-input:focus-visible', { outlineOffset: -1 });
