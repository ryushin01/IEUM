import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

const WIDE = 'screen and (min-width: 768px)';
const RAIL = '100px';

export const skip = style({
  position: 'fixed', top: -100, left: 8, zIndex: 300, padding: '10px 16px',
  backgroundColor: vars.color.primary, color: vars.color.onPrimary,
  selectors: { '&:focus': { top: 8 } },
});

export const header = style({
  position: 'sticky', top: 0, zIndex: 101, display: 'flex', alignItems: 'center', gap: 4,
  minHeight: vars.layout.header, padding: '0 16px', borderBottom: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.header, color: vars.color.onHeader,
  '@media': {
    [WIDE]: {
      position: 'fixed', left: 0, top: 0, flexDirection: 'column', justifyContent: 'center', gap: 16,
      width: RAIL, height: '30%', padding: 0, borderRight: `1px solid ${vars.color.border}`, borderBottom: 0,
    },
  },
});
export const back = style({
  marginLeft: -12,
  '@media': { [WIDE]: { position: 'fixed', top: 8, left: `calc(${RAIL} + 8px)`, marginLeft: 0 } },
});
export const brand = style({ display: 'inline-flex', alignItems: 'center', minHeight: 44, textDecoration: 'none' });
export const tools = style({
  display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto',
  '@media': { [WIDE]: { marginLeft: 0 } },
});
/** 모바일은 오른쪽 위, 넓은 화면은 왼쪽 아래입니다. */
export const theme = style({
  '@media': { [WIDE]: { position: 'fixed', left: 22, bottom: 35, zIndex: 110 } },
});
/** 진한 알약 모양의 글쓰기 버튼 */
export const write = style({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 44, padding: '0 14px',
  borderRadius: 999, backgroundColor: vars.color.ink, color: vars.color.onInk, fontSize: 14, fontWeight: 700,
  textDecoration: 'none', whiteSpace: 'nowrap',
});

export const nav = style({
  position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100, height: vars.layout.nav,
  borderTop: `1px solid ${vars.color.border}`, backgroundColor: vars.color.surface,
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
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, width: '100%', height: '100%', minHeight: 44,
  padding: 0, border: 0, background: 'none', color: vars.color.muted, font: 'inherit', fontSize: 12, textDecoration: 'none', cursor: 'pointer',
  selectors: { '&[aria-current="page"]': { color: vars.color.primary, fontWeight: 700 } },
});
export const navIcon = style({
  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
  minWidth: 32, height: 28, fontSize: 24,
});
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
