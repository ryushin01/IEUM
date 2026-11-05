import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const hero = style({
  margin: 0, padding: '12px 20px 68px', backgroundColor: vars.color.header, color: vars.color.onHeader,
  fontSize: 25, fontWeight: 800, lineHeight: 1.3, letterSpacing: '-0.02em', wordBreak: 'keep-all',
});
/** 첫 카드가 빨간 영역 위로 겹쳐 올라옵니다. */
export const list = style({ position: 'relative', marginTop: -48 });
