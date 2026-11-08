import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const hitArea = style({ display: 'inline-flex' });

/** 56×28 트랙입니다. 눌리는 영역은 ::after로 44px까지 넓힙니다. */
export const track = style({
  position: 'relative', display: 'block', width: 56, height: 28, padding: 0, border: `1px solid ${vars.color.control}`, borderRadius: 14,
  backgroundColor: 'transparent', color: vars.color.text, cursor: 'pointer',
  selectors: { '&::after': { content: '""', position: 'absolute', inset: '-10px -4px' } },
});

export const handle = style({
  position: 'absolute', top: 3, left: 3, width: 20, height: 20, borderRadius: '50%', backgroundColor: vars.color.text,
  transition: 'transform 0.1s',
  selectors: { '[aria-checked="true"] > &': { transform: 'translateX(28px)' } },
  '@media': { '(prefers-reduced-motion: reduce)': { transition: 'none' } },
});

export const icon = style({
  position: 'absolute', top: 6, left: 32, fontSize: 14, lineHeight: 1,
  selectors: { '[aria-checked="true"] > &': { left: 8 } },
});
