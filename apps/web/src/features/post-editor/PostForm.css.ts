import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ margin: 12, padding: 18, borderRadius: 24, backgroundColor: vars.color.surface, boxShadow: `0 6px 18px ${vars.color.shadow}` });
export const images = style({ display: 'grid', gap: 12, marginBottom: 12 });
export const imageRow = style({ display: 'grid', gridTemplateColumns: '72px 1fr 44px', gap: 8, alignItems: 'center' });
export const thumb = style({ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: `1px solid ${vars.color.border}` });
export const pickRow = style({ display: 'flex', gap: 8, marginBottom: 16 });
export const hint = style({ margin: '0 0 8px', fontSize: 14, color: vars.color.muted });
