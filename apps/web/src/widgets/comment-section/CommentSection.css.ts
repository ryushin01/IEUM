import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const section = style({ margin: '0 12px 12px', padding: 18, borderRadius: 24, backgroundColor: vars.color.surface, boxShadow: `0 6px 18px ${vars.color.shadow}` });
export const title = style({ marginBottom: 12, fontSize: 18, fontWeight: 800 });
export const list = style({ display: 'grid', gap: 16, marginBottom: 16 });
export const item = style({ display: 'grid', gridTemplateColumns: '28px 1fr auto', gap: 8, alignItems: 'start' });
export const author = style({ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontWeight: 700, textDecoration: 'none' });
export const body = style({ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' });
export const date = style({ fontSize: 13, color: vars.color.muted });
