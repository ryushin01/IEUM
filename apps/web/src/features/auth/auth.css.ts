import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const inline = style({ display: 'flex', gap: 8 });
export const complete = style({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' });
export const notice = style({ marginTop: 12, textAlign: 'center', overflowWrap: 'anywhere' });
export const demo = style({ display: 'grid', gap: 10 });
globalStyle(`${demo} p`, { fontSize: 13, lineHeight: 1.55, color: vars.color.muted });
export const completeIcon = style({ fontSize: 64, color: vars.color.primary });
