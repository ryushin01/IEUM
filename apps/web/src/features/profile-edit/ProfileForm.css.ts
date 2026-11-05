import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ margin: 12, padding: 18, borderRadius: 24, backgroundColor: vars.color.surface, boxShadow: `0 6px 18px ${vars.color.shadow}` });
export const avatarRow = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 });
