import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ display: 'grid', gap: 8, padding: '10px 16px', borderTop: `1px solid ${vars.color.border}`, backgroundColor: vars.color.surface });
export const row = style({ display: 'flex', gap: 8 });
globalStyle(`${row} .ant-btn`, { flexShrink: 0, width: 44 });
