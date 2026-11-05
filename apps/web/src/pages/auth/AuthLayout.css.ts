import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const page = style({ display: 'flex', flexDirection: 'column', minHeight: '100dvh', padding: '40px 24px', maxWidth: 420, margin: '0 auto' });
export const brand = style({ margin: '32px 0 32px', textAlign: 'center' });
export const title = style({ fontWeight: 400, fontSize: 'inherit' });
export const tagline = style({ marginTop: 12, fontSize: 20 });
export const footer = style({ marginTop: 20, textAlign: 'center', color: vars.color.muted });
