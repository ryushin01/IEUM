import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const head = style({ display: 'flex', gap: 14, margin: 12, padding: 18, borderRadius: 24, backgroundColor: vars.color.surface, boxShadow: `0 6px 18px ${vars.color.shadow}` });
export const info = style({ flex: 1, minWidth: 0 });
export const name = style({ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', overflowWrap: 'anywhere' });
export const bio = style({ marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const count = style({ marginTop: 4, color: vars.color.muted });
export const actions = style({ display: 'flex', gap: 8, padding: '0 12px 14px' });
export const grid = style({ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '0 12px' });
export const gridLink = style({ display: 'block', aspectRatio: '1 / 1', overflow: 'hidden', borderRadius: 18, backgroundColor: vars.color.surface });
export const gridImage = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const interests = style({ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 });
export const interest = style({ padding: '4px 12px', borderRadius: 999, backgroundColor: vars.color.accentSoft, color: vars.color.onAccentSoft, fontSize: 13, fontWeight: 700 });
