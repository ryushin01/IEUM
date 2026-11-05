import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const row = styleVariants({
  mine: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  other: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start' },
});
export const bubble = styleVariants({
  mine: { maxWidth: '78%', padding: '12px 15px', borderRadius: '20px 20px 6px 20px', fontWeight: 500, backgroundColor: vars.color.primary, color: vars.color.onPrimary, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  other: { maxWidth: '78%', padding: '12px 15px', borderRadius: '20px 20px 20px 6px', fontWeight: 500, boxShadow: `0 2px 8px ${vars.color.shadow}`, backgroundColor: vars.color.bubbleOther, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
});
export const meta = style({ marginTop: 2, fontSize: 12, color: vars.color.muted });
