import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const comments = style({
  display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44,
  color: vars.color.text, textDecoration: 'none',
});
export const write = style({ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 });
