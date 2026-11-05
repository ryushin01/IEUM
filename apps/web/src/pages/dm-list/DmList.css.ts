import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const title = style({ padding: '16px 16px 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' });
export const link = style({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 72, margin: '0 12px 8px', padding: '10px 14px', borderRadius: 20, backgroundColor: vars.color.surface, boxShadow: `0 2px 8px ${vars.color.shadow}`, textDecoration: 'none' });
export const texts = style({ flex: 1, minWidth: 0 });
export const top = style({ display: 'flex', justifyContent: 'space-between', gap: 8 });
export const name = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 800 });
export const time = style({ flexShrink: 0, fontSize: 13, color: vars.color.muted });
export const preview = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: vars.color.muted });
export const unread = style({ flexShrink: 0, minWidth: 24, padding: '0 6px', borderRadius: 12, backgroundColor: vars.color.primary, color: vars.color.onPrimary, textAlign: 'center', fontSize: 14, fontWeight: 700 });
