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
  borderBottom: `1px solid ${vars.color.border}`, backgroundColor: vars.color.bg,
  '@media': {
    [WIDE]: {
      position: 'fixed', left: 0, top: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: RAIL, height: '30%', borderBottom: 0, borderRight: `1px solid ${vars.color.border}`,
    },
  },
});
export const back = style({
  '@media': { [WIDE]: { position: 'fixed', top: 8, left: `calc(${RAIL} + 8px)` } },
});
export const brand = style({ justifySelf: 'center', display: 'inline-flex', alignItems: 'center', minHeight: 44, textDecoration: 'none' });
/** sprout 위치: 모바일은 오른쪽 위, 넓은 화면은 왼쪽 아래입니다. */
export const theme = style({
  justifySelf: 'end', marginRight: 4,
  '@media': { [WIDE]: { position: 'fixed', left: 22, bottom: 35, zIndex: 110, marginRight: 0 } },
});

export const nav = style({
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100, height: vars.layout.nav,
  borderTop: `1px solid ${vars.color.border}`, backgroundColor: vars.color.bg,
  '@media': {
    [WIDE]: { top: '30%', right: 'auto', width: RAIL, height: 'auto', borderTop: 0, borderRight: `1px solid ${vars.color.border}` },
  },
});
export const navList = style({
  display: 'flex', height: '100%',
  '@media': { [WIDE]: { flexDirection: 'column', height: 'calc(100% - 100px)' } },
});
export const navItem = style({ flex: 1, minWidth: 0 });
export const navLink = style({
  display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', minHeight: 44,
  padding: 0, border: 0, background: 'none', color: vars.color.muted, fontSize: 24, textDecoration: 'none', cursor: 'pointer',
});
export const navIcon = style({
  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 52, height: 36, borderRadius: 18,
});
/** sprout GNB의 3px 프로필 링 */
export const navAvatar = style({
  display: 'flex', width: 32, height: 32, padding: 0, alignItems: 'center', justifyContent: 'center',
  border: `2px solid ${vars.color.muted}`, borderRadius: '50%', overflow: 'hidden',
});
globalStyle(`${navLink}[aria-current="page"]`, { color: vars.color.onPrimary });
globalStyle(`${navLink}[aria-current="page"] ${navIcon}`, { backgroundColor: vars.color.primary });
globalStyle(`${navLink}[aria-current="page"] ${navAvatar}`, { borderColor: vars.color.onPrimary });
export const badge = style({
  position: 'absolute', top: 0, right: 4, minWidth: 18, height: 18, padding: '0 4px', borderRadius: 9,
  backgroundColor: vars.color.error, color: vars.color.bg, fontSize: 12, lineHeight: '18px', textAlign: 'center',
});

const wideMain = {
  marginLeft: `calc(${RAIL} + max(0px, (100% - ${RAIL} - ${vars.layout.content}) / 2))`,
};
export const main = style({
  maxWidth: vars.layout.content, margin: '0 auto', paddingBottom: `calc(${vars.layout.nav} + 8px)`, outline: 'none',
  '@media': { [WIDE]: { ...wideMain, paddingBottom: 24 } },
});
/** DM 방은 입력창을 화면 아래에 고정합니다. */
export const mainFull = style({
  height: `calc(100dvh - ${vars.layout.header})`, maxWidth: vars.layout.content, margin: '0 auto', outline: 'none',
  '@media': { [WIDE]: { ...wideMain, height: '100dvh' } },
});
