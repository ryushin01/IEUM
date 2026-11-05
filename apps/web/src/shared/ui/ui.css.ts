import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const srOnly = style({
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
});

export const logo = style({
  display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 900,
  letterSpacing: '0.02em', lineHeight: 1, color: 'inherit', textDecoration: 'none',
});
export const logoMark = style({
  width: '0.42em', height: '0.42em', borderRadius: '50%', backgroundColor: vars.color.accent,
});

export const avatar = style({
  display: 'block', flexShrink: 0, borderRadius: '50%', objectFit: 'cover',
  backgroundColor: vars.color.surface, border: `1px solid ${vars.color.border}`,
});
export const avatarFallback = style({
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '50%',
  backgroundColor: vars.color.likeSoft, color: vars.color.like, fontSize: '0.5em', fontWeight: 800,
});

export const carousel = style({ position: 'relative', overflow: 'hidden', borderRadius: 18 });
export const track = style({
  display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', aspectRatio: '1 / 1',
  backgroundColor: vars.color.surface, scrollbarWidth: 'none',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});
export const slide = style({ flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always' });
export const slideImage = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const carouselButton = style({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', color: '#fff', cursor: 'pointer',
  selectors: { '&:disabled': { display: 'none' } },
});
export const carouselCounter = style({
  position: 'absolute', top: 12, right: 12, padding: '2px 10px', borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff', fontSize: 14,
});

export const centered = style({
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 12, padding: '48px 16px', textAlign: 'center', color: vars.color.muted,
});

/** 프로필 링: 인기 게시글 작성자와 프로필 화면에 씁니다. */
export const hotRing = style({
  display: 'flex', alignSelf: 'flex-start', flexShrink: 0, padding: 2, borderRadius: '50%',
  backgroundColor: vars.color.primary,
});
export const hotInner = style({ display: 'flex', padding: 1, borderRadius: '50%', backgroundColor: vars.color.surface });
export const official = style({ color: vars.color.official, fontSize: 14, flexShrink: 0 });

export const chipGroup = style({ margin: 0, padding: 0, border: 0, minWidth: 0 });
export const chipLegend = style({ marginBottom: 8, padding: 0 });
export const chips = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });
export const chipInput = style({ position: 'absolute', opacity: 0, width: 1, height: 1 });
export const chip = style({
  display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, padding: '0 16px', borderRadius: 999, fontWeight: 700,
  border: `1px solid ${vars.color.border}`, color: vars.color.muted, cursor: 'pointer',
  selectors: {
    [`${chipInput}:checked + &`]: { borderColor: vars.color.primary, backgroundColor: vars.color.primary, color: vars.color.onPrimary },
    [`${chipInput}:focus-visible + &`]: { outline: `2px solid ${vars.color.focus}`, outlineOffset: 2 },
    [`${chipInput}:disabled:not(:checked) + &`]: { opacity: 0.55, cursor: 'not-allowed' },
  },
});
