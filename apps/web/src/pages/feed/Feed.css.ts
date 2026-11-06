import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const hero = style({
  marginBottom: vars.layout.band, padding: '20px 16px 24px', backgroundColor: vars.color.surface,
  fontSize: 26, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.02em',
});
export const emphasis = style({ color: vars.color.primary, fontStyle: 'normal' });
