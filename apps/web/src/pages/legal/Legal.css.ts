import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const doc = style({ maxWidth: 680, margin: '0 auto', padding: '24px 16px 64px' });
export const back = style({ display: 'inline-flex', alignItems: 'center', minHeight: 44 });
globalStyle(`${doc} h1`, { margin: '8px 0 16px', fontSize: 26, fontWeight: 800 });
globalStyle(`${doc} h2`, { margin: '24px 0 8px', fontSize: 19, fontWeight: 800 });
globalStyle(`${doc} ul`, { paddingLeft: 20, listStyle: 'disc' });
globalStyle(`${doc} p, ${doc} li`, { color: vars.color.text });
