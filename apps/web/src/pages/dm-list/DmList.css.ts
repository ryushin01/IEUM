import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const page = style({ minHeight: `calc(100dvh - ${vars.layout.header} - ${vars.layout.nav})`, backgroundColor: vars.color.surface });
export const title = style({ padding: '20px 16px 12px', fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' });
export const link = style({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 72, padding: '10px 16px', borderBottom: `1px solid ${vars.color.border}`, textDecoration: 'none' });
export const texts = style({ flex: 1, minWidth: 0 });
export const top = style({ display: 'flex', justifyContent: 'space-between', gap: 8 });
export const name = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700 });
export const time = style({ flexShrink: 0, fontSize: 13, color: vars.color.muted });
export const preview = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: vars.color.muted });
export const unread = style({ flexShrink: 0, minWidth: 24, padding: '0 6px', borderRadius: 12, backgroundColor: vars.color.primary, color: vars.color.onPrimary, textAlign: 'center', fontSize: 14, fontWeight: 700 });
