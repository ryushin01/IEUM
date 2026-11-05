import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const title = style({ padding: '16px 16px 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' });
export const row = style({
  margin: '0 12px', borderBottom: `1px solid ${vars.color.border}`, backgroundColor: vars.color.surface,
  selectors: {
    '&:first-child': { borderRadius: '20px 20px 0 0' },
    '&:last-child': { borderBottom: 0, borderRadius: '0 0 20px 20px' },
  },
});
const rowBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', minHeight: 52,
  padding: '0 16px', border: 0, background: 'none', color: vars.color.text, font: 'inherit',
  textAlign: 'left', textDecoration: 'none', cursor: 'pointer',
} as const;
export const action = style(rowBase);
export const danger = style({ ...rowBase, color: vars.color.error });
export const version = style({ padding: 16, color: vars.color.muted, fontSize: 14 });
