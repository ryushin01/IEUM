import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const card = style({ padding: '12px 0 20px', borderBottom: `1px solid ${vars.color.border}` });
export const header = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 16px 12px' });
export const author = style({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, minWidth: 0, textDecoration: 'none' });
export const names = style({ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 });
export const nameRow = style({ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 });
export const nickname = style({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const date = style({ fontSize: 13, color: vars.color.muted });
export const actions = style({ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px 0' });
export const caption = style({ padding: '6px 16px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const captionClamp = style({ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' });
