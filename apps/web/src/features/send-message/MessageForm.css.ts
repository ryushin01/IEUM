import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ display: 'grid', gap: 8, padding: 8, borderTop: `1px solid ${vars.color.border}`, backgroundColor: vars.color.bg });
export const row = style({ display: 'flex', gap: 8 });
