import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const room = style({ display: 'flex', flexDirection: 'column', height: '100%' });
export const head = style({ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 4px 16px', borderBottom: `1px solid ${vars.color.border}` });
export const peer = style({ display: 'flex', flex: 1, alignItems: 'center', gap: 8, minWidth: 0, minHeight: 44, textDecoration: 'none' });
export const name = style({ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 16, fontWeight: 700 });
export const log = style({ flex: 1, overflowY: 'auto', padding: 12 });
export const list = style({ display: 'grid', gap: 10 });
export const notice = style({ padding: 12, textAlign: 'center', color: vars.color.muted, borderTop: `1px solid ${vars.color.border}` });
