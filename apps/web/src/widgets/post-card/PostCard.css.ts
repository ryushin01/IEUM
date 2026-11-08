import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const comments = style({
  display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44,
  color: vars.color.text, textDecoration: 'none',
});
export const write = style({ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' });

export const feedList = style({});
// 스크롤하면 게시글이 한 장씩 맞춰 멈춥니다. 키보드와 큰 글자에서 막히지 않도록 강제하지는 않습니다.
globalStyle(`html:has(${feedList})`, {
  scrollSnapType: 'y proximity', scrollPaddingTop: vars.layout.header,
  '@media': { 'screen and (min-width: 768px)': { scrollPaddingTop: 0 } },
});
