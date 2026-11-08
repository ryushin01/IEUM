import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const page = style({ minHeight: `calc(100dvh - ${vars.layout.header} - ${vars.layout.nav})`, backgroundColor: vars.color.surface });
export const title = style({ padding: '20px 16px 8px', backgroundColor: vars.color.surface, fontSize: 20, fontWeight: 700 });
/** 머리카락 굵기의 선으로 나누는 목록입니다. */
export const row = style({ margin: '0 16px', borderBottom: `1px solid ${vars.color.border}` });
const rowBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 56,
  padding: 0, border: 0, background: 'none', color: vars.color.text, font: 'inherit', fontSize: 15,
  textAlign: 'left', textDecoration: 'none', cursor: 'pointer',
} as const;
// 다른 화면으로 가는 항목에만 꺾쇠를 붙입니다.
export const action = style({
  ...rowBase,
  selectors: {
    '&[href]::after': { content: '""', width: 8, height: 8, marginRight: 3, borderTop: '1.5px solid currentColor', borderRight: '1.5px solid currentColor', transform: 'rotate(45deg)' },
  },
});
export const danger = style({ ...rowBase, color: vars.color.error });
export const version = style({ padding: 16, color: vars.color.muted, fontSize: 13 });
