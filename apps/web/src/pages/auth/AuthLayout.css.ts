import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

/** 화면 전체를 한 면으로 두고 내용만 가운데 폭으로 모읍니다. */
export const page = style({
  display: 'flex', flexDirection: 'column', gap: 24, minHeight: '100dvh',
  padding: '0 max(16px, calc((100% - 388px) / 2)) 40px', backgroundColor: vars.color.surface,
});
export const brand = style({ padding: '64px 0 8px' });
export const title = style({ fontSize: 'inherit' });
export const tagline = style({ marginTop: 20, fontSize: 20, fontWeight: 400, lineHeight: 1.3, letterSpacing: '-0.02em' });
export const taglineStrong = style({ display: 'block', marginTop: 4, fontSize: 30, fontWeight: 700 });
export const subBrand = style({ padding: '24px 0 0' });
export const subTitle = style({ marginTop: 20, fontSize: 22, fontWeight: 700, lineHeight: 1.35, letterSpacing: '-0.02em' });
export const footer = style({ textAlign: 'center', color: vars.color.muted });
