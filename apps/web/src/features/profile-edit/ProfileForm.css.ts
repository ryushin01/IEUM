import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ marginBottom: vars.layout.band, padding: 16, backgroundColor: vars.color.surface });
export const avatarRow = style({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 16 });
