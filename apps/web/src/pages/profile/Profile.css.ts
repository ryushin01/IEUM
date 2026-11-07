import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const head = style({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '24px 16px 16px', backgroundColor: vars.color.surface, textAlign: 'center' });
export const info = style({ width: '100%', minWidth: 0 });
export const name = style({ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', overflowWrap: 'anywhere' });
export const bio = style({ marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: vars.color.muted });
export const count = style({ marginTop: 4, color: vars.color.muted });
export const countValue = style({ color: vars.color.primary });
export const actions = style({ display: 'flex', gap: 8, padding: '0 16px 16px', backgroundColor: vars.color.surface });
export const posts = style({ marginTop: vars.layout.band, backgroundColor: vars.color.surface });
export const postsTitle = style({ padding: '14px 16px', borderBottom: `1px solid ${vars.color.border}`, fontSize: 15, fontWeight: 600 });
export const grid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 });
export const gridLink = style({ display: 'block', aspectRatio: '1 / 1', overflow: 'hidden', backgroundColor: vars.color.bg });
export const gridImage = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const interests = style({ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 10 });
export const interest = style({ padding: '4px 12px', borderRadius: 999, backgroundColor: vars.color.accentSoft, color: vars.color.onAccentSoft, fontSize: 13, fontWeight: 500 });
