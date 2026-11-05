import { style } from '@vanilla-extract/css';

export const inline = style({ display: 'flex', gap: 8 });
export const complete = style({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 0', textAlign: 'center' });
export const notice = style({ marginTop: 12, textAlign: 'center', overflowWrap: 'anywhere' });
