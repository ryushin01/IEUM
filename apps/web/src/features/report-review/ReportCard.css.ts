import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const card = style({ display: 'grid', gap: 8, margin: '0 12px 12px', padding: 16, borderRadius: 20, backgroundColor: vars.color.surface, boxShadow: `0 2px 8px ${vars.color.shadow}` });
export const head = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 });
export const overdue = style({ padding: '0 10px', borderRadius: 999, backgroundColor: vars.color.error, color: vars.color.bg, fontSize: 14 });
export const meta = style({ color: vars.color.muted, fontSize: 14 });
export const body = style({ display: 'flex', gap: 12, padding: 12, borderRadius: 14, backgroundColor: vars.color.bg });
export const image = style({ width: 72, height: 72, flexShrink: 0, objectFit: 'cover', borderRadius: 12 });
export const text = style({ minWidth: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const actions = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });
