import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const row = styleVariants({
  mine: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  other: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
});
export const bubble = styleVariants({
  mine: { maxWidth: '78%', padding: '8px 12px', borderRadius: '14px 14px 2px 14px', backgroundColor: vars.color.primary, color: vars.color.onPrimary, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  other: { maxWidth: '78%', padding: '8px 12px', borderRadius: '14px 14px 14px 2px', backgroundColor: vars.color.bubbleOther, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
});
export const meta = style({ marginTop: 2, fontSize: 12, color: vars.color.muted });
