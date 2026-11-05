import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ display: 'grid', gap: 8, padding: '12px 14px', borderRadius: '24px 24px 0 0', backgroundColor: vars.color.surface, boxShadow: `0 -4px 16px ${vars.color.shadow}` });
export const row = style({ display: 'flex', gap: 8 });
