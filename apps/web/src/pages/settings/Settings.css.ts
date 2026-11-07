import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const page = style({ minHeight: `calc(100dvh - ${vars.layout.header} - ${vars.layout.nav})`, backgroundColor: vars.color.surface });
export const title = style({ padding: '20px 16px 8px', backgroundColor: vars.color.surface, fontSize: 20, fontWeight: 700 });
/** 구분선 없이 여백으로만 나누는 큰 목록입니다. */
export const row = style({});
const rowBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 52,
  padding: '0 16px', border: 0, background: 'none', color: vars.color.text, font: 'inherit', fontSize: 15,
  textAlign: 'left', textDecoration: 'none', cursor: 'pointer',
} as const;
export const action = style(rowBase);
export const danger = style({ ...rowBase, color: vars.color.error });
export const version = style({ padding: 16, color: vars.color.muted, fontSize: 13 });
