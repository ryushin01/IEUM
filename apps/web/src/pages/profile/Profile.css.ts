import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const head = style({ display: 'flex', gap: 16, padding: 16 });
export const info = style({ flex: 1, minWidth: 0 });
export const name = style({ fontSize: 22, fontWeight: 400, overflowWrap: 'anywhere' });
export const bio = style({ marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const count = style({ marginTop: 4, color: vars.color.muted });
export const actions = style({ display: 'flex', gap: 8, padding: '0 16px 16px' });
export const grid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 });
export const gridLink = style({ display: 'block', aspectRatio: '1 / 1', backgroundColor: vars.color.surface });
export const gridImage = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const interests = style({ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 });
export const interest = style({ padding: '2px 10px', borderRadius: 4, backgroundColor: vars.color.primary, color: vars.color.onPrimary, fontSize: 14 });
