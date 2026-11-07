import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const row = styleVariants({
  mine: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  other: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
});
export const bubble = styleVariants({
  mine: { maxWidth: '78%', padding: '10px 14px', borderRadius: '16px 16px 4px 16px', backgroundColor: vars.color.primary, color: vars.color.onPrimary, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  other: { maxWidth: '78%', padding: '10px 14px', borderRadius: '16px 16px 16px 4px', backgroundColor: vars.color.bubbleOther, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
});
export const meta = style({ marginTop: 4, fontSize: 11, color: vars.color.muted });
