import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const card = style({ display: 'grid', gap: 8, marginBottom: vars.layout.band, padding: 16, backgroundColor: vars.color.surface });
export const head = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 });
export const overdue = style({ padding: '0 10px', borderRadius: 999, backgroundColor: vars.color.error, color: vars.color.bg, fontSize: 13 });
export const meta = style({ color: vars.color.muted, fontSize: 13 });
export const body = style({ display: 'flex', gap: 12, padding: 12, borderRadius: 10, backgroundColor: vars.color.bg });
export const image = style({ width: 72, height: 72, flexShrink: 0, objectFit: 'cover', borderRadius: 12 });
export const text = style({ minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const actions = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });
