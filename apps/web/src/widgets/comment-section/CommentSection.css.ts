import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const section = style({ padding: 16 });
export const title = style({ marginBottom: 12, fontSize: 18, fontWeight: 400 });
export const list = style({ display: 'grid', gap: 16, marginBottom: 16 });
export const item = style({ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 8, alignItems: 'start' });
export const author = style({ fontWeight: 700, textDecoration: 'none' });
export const body = style({ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' });
export const date = style({ fontSize: 13, color: vars.color.muted });
