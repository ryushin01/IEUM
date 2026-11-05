import { globalStyle, style } from '@vanilla-extract/css';

export const hitArea = style({ display: 'inline-flex' });
globalStyle(`${hitArea} button`, { position: 'relative' });
globalStyle(`${hitArea} button::after`, { content: '""', position: 'absolute', inset: '-10px -4px' });
