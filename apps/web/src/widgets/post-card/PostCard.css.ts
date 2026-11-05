import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const allComments = style({
  display: 'block', minHeight: 44, padding: '0 2px', border: 0, background: 'none',
  color: vars.color.muted, font: 'inherit', fontSize: 14, cursor: 'pointer',
});
export const write = style({ display: 'flex', alignItems: 'center', gap: 8 });
