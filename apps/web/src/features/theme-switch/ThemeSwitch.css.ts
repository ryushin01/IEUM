import { style } from '@vanilla-extract/css';

const INK = '#31313b';
const ACTIVE = '#5ea3ff';
const ON_ACTIVE = '#10131a';

export const hitArea = style({ display: 'inline-flex' });

/** 56×28 트랙입니다. 눌리는 영역은 ::after로 44px까지 넓힙니다. */
export const track = style({
  position: 'relative', display: 'block', width: 56, height: 28, padding: 0, border: 0, borderRadius: 14,
  backgroundColor: INK, color: '#ffffff', cursor: 'pointer', transition: 'background-color 0.1s',
  selectors: {
    '&::after': { content: '""', position: 'absolute', inset: '-10px -4px' },
    '&[aria-checked="true"]': { backgroundColor: ACTIVE, color: ON_ACTIVE },
  },
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});

export const handle = style({
  position: 'absolute', top: 4, left: 4, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#ffffff',
  transition: 'transform 0.1s',
  selectors: { '[aria-checked="true"] > &': { transform: 'translateX(28px)' } },
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});

export const icon = style({
  position: 'absolute', top: 7, left: 33, fontSize: 14, lineHeight: 1,
  selectors: { '[aria-checked="true"] > &': { left: 9 } },
});
