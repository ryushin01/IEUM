import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const card = style({ margin: '0 12px 14px', padding: 14, borderRadius: 24, backgroundColor: vars.color.surface, boxShadow: `0 6px 18px ${vars.color.shadow}` });
export const header = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 10 });
export const author = style({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, minWidth: 0, textDecoration: 'none' });
export const names = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });
export const nameRow = style({ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 });
export const nickname = style({ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const date = style({ fontSize: 13, color: vars.color.muted });
export const actions = style({ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 });
export const caption = style({ padding: '10px 2px 0', fontSize: 15, fontWeight: 500, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const captionClamp = style({ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' });
