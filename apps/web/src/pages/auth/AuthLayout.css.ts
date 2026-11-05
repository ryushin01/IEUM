import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const page = style({ display: 'flex', flexDirection: 'column', minHeight: '100dvh', padding: '0 16px 40px', maxWidth: 420, margin: '0 auto' });
export const brand = style({
  margin: '0 -16px -56px', padding: '48px 24px 88px', borderRadius: '0 0 28px 28px', textAlign: 'center',
  backgroundColor: vars.color.header, color: vars.color.onHeader,
});
export const title = style({ fontWeight: 900, fontSize: 'inherit' });
export const tagline = style({ marginTop: 12, fontSize: 21, fontWeight: 800, letterSpacing: '-0.02em' });
export const footer = style({ marginTop: 20, textAlign: 'center', color: vars.color.muted });
// 안내, 양식은 빨간 영역 위로 겹쳐 올라오는 카드입니다.
globalStyle(`${page} > form, ${page} > section`, {
  position: 'relative', marginTop: 0, marginBottom: 14, padding: 18, borderRadius: 24,
  backgroundColor: vars.color.surface, boxShadow: `0 6px 18px ${vars.color.shadow}`,
});
