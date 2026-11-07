import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

/** 카드 대신 흰 구획을 회색 띠로 나눕니다. */
export const card = style({ marginBottom: vars.layout.band, padding: '16px 16px 12px', backgroundColor: vars.color.surface });
export const header = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 });
export const author = style({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, minWidth: 0, textDecoration: 'none' });
export const names = style({ display: 'flex', flexDirection: 'column', minWidth: 0 });
export const nameRow = style({ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 });
export const nickname = style({ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const date = style({ fontSize: 12, color: vars.color.muted });
export const caption = style({ padding: '12px 0', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const captionClamp = style({ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' });
export const stats = style({ padding: '12px 0', fontSize: 13, color: vars.color.muted });
export const actions = style({ display: 'flex', alignItems: 'stretch', borderTop: `1px solid ${vars.color.border}` });
