import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const section = style({ marginBottom: vars.layout.band, padding: 16, backgroundColor: vars.color.surface });
export const title = style({ marginBottom: 16, fontSize: 15, fontWeight: 600 });
export const list = style({ display: 'grid', gap: 20, marginBottom: 16 });
export const item = style({ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 12, alignItems: 'start' });
export const author = style({ display: 'inline-flex', alignItems: 'center', minHeight: 44, marginTop: -10, marginBottom: -10, color: vars.color.primary, fontWeight: 600, textDecoration: 'none' });
export const body = style({ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' });
export const date = style({ fontSize: 12, color: vars.color.muted });
