import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

const WIDE = 'screen and (min-width: 768px)';
const RAIL = '100px';

export const skip = style({
  position: 'fixed', top: -100, left: 8, zIndex: 300, padding: '10px 16px',
  backgroundColor: vars.color.primary, color: vars.color.onPrimary,
  selectors: { '&:focus': { top: 8 } },
});

export const header = style({
  position: 'sticky', top: 0, zIndex: 101, display: 'grid', gridTemplateColumns: '64px 1fr 64px',
  alignItems: 'center', height: vars.layout.header, padding: '0 4px',
  backgroundColor: vars.color.header, color: vars.color.onHeader,
  '@media': {
    [WIDE]: {
      position: 'fixed', left: 0, top: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: RAIL, height: '30%',
    },
  },
});
export const back = style({
  '@media': { [WIDE]: { position: 'fixed', top: 8, left: `calc(${RAIL} + 8px)` } },
});
// 뒤로 가기는 모바일에서 빨간 헤더 위에 있고, 넓은 화면에서는 본문 위에 있습니다.
globalStyle(`${back}.ant-btn`, { color: vars.color.onHeader });
globalStyle(`${back}.ant-btn`, { '@media': { [WIDE]: { color: vars.color.text } } });
export const brand = style({ justifySelf: 'center', display: 'inline-flex', alignItems: 'center', minHeight: 44, textDecoration: 'none' });
/** sprout 위치: 모바일은 오른쪽 위, 넓은 화면은 왼쪽 아래입니다. */
export const theme = style({
  justifySelf: 'end', marginRight: 4,
  '@media': { [WIDE]: { position: 'fixed', left: 22, bottom: 35, zIndex: 110, marginRight: 0 } },
});

export const nav = style({
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100, height: vars.layout.nav,
  borderRadius: '24px 24px 0 0', backgroundColor: vars.color.surface, boxShadow: `0 -4px 16px ${vars.color.shadow}`,
  '@media': {
    [WIDE]: { top: '30%', right: 'auto', width: RAIL, height: 'auto', borderRadius: 0, boxShadow: 'none' },
  },
});
export const navList = style({
  display: 'flex', height: '100%',
  '@media': { [WIDE]: { flexDirection: 'column', height: 'calc(100% - 100px)' } },
});
export const navItem = style({ flex: 1, minWidth: 0 });
export const navLink = style({
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%', height: '100%', minHeight: 44,
  padding: 0, border: 0, background: 'none', color: vars.color.text, font: 'inherit', fontSize: 12, fontWeight: 700, textDecoration: 'none', cursor: 'pointer',
});
export const navIcon = style({
  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 32, height: 28, fontSize: 24,
});
/** 프로필 링 */
export const navAvatar = style({
  display: 'flex', width: 28, height: 28, padding: 0, alignItems: 'center', justifyContent: 'center',
  border: `2px solid ${vars.color.primary}`, borderRadius: '50%', overflow: 'hidden',
});
globalStyle(`${navLink}[aria-current="page"]`, { color: vars.color.primary, fontWeight: 800 });
/** 가운데의 큰 글쓰기 버튼 */
export const navWrite = style({
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, margin: '-18px auto 0',
  borderRadius: '50%', backgroundColor: vars.color.primary, color: vars.color.onPrimary, fontSize: 28, textDecoration: 'none',
  boxShadow: `0 4px 0 ${vars.color.primaryStrong}`,
  selectors: { '&:active': { boxShadow: `0 1px 0 ${vars.color.primaryStrong}`, transform: 'translateY(3px)' } },
  '@media': { [WIDE]: { margin: 'auto' } },
});
export const navWriteItem = style({ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' });
export const badge = style({
  position: 'absolute', top: -4, right: -8, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9,
  backgroundColor: vars.color.error, color: vars.color.bg, fontSize: 11, fontWeight: 700, lineHeight: '18px', textAlign: 'center',
});

const wideMain = {
  marginLeft: `calc(${RAIL} + max(0px, (100% - ${RAIL} - ${vars.layout.content}) / 2))`,
};
export const main = style({
  maxWidth: vars.layout.content, margin: '0 auto', paddingBottom: `calc(${vars.layout.nav} + 24px)`, outline: 'none',
  '@media': { [WIDE]: { ...wideMain, paddingBottom: 24 } },
});
/** DM 방은 입력창을 화면 아래에 고정합니다. */
export const mainFull = style({
  height: `calc(100dvh - ${vars.layout.header})`, maxWidth: vars.layout.content, margin: '0 auto', outline: 'none',
  '@media': { [WIDE]: { ...wideMain, height: '100dvh' } },
});
/** 앱에서는 아래에 Flutter 메뉴가 따로 있어 여백을 두지 않습니다. */
export const mainEmbedded = style({ maxWidth: vars.layout.content, margin: '0 auto', paddingBottom: 8, outline: 'none' });
