import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const srOnly = style({
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0,
});

export const logo = style({ display: 'block', height: '0.75em', width: 'auto', fill: 'currentColor', color: 'inherit' });
export const logoMark = style({ fill: vars.color.accent });

export const avatar = style({
  display: 'block', flexShrink: 0, borderRadius: '50%', objectFit: 'cover',
  backgroundColor: vars.color.surface, border: `1px solid ${vars.color.border}`,
});
export const avatarFallback = style({
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: '50%',
  backgroundColor: vars.color.avatarBg, color: vars.color.onAvatar, fontSize: '0.5em', fontWeight: 600,
});

export const carousel = style({ position: 'relative', overflow: 'hidden', borderRadius: 8 });
export const track = style({
  display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', aspectRatio: '1 / 1',
  backgroundColor: vars.color.surface, scrollbarWidth: 'none',
  selectors: { '&::-webkit-scrollbar': { display: 'none' } },
});
export const carouselFill = style({ height: '100%', borderRadius: 0 });
export const trackFill = style({ height: '100%', aspectRatio: 'auto' });
export const slide = style({ position: 'relative', flex: '0 0 100%', overflow: 'hidden', scrollSnapAlign: 'start', scrollSnapStop: 'always' });
export const slideBackdrop = style({
  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
  // 가장자리의 흐린 경계가 보이지 않게 조금 키웁니다.
  filter: 'blur(24px) brightness(0.7)', transform: 'scale(1.15)',
});
export const slideImage = style({ position: 'relative', width: '100%', height: '100%', objectFit: 'contain' });
/** 전체화면에서는 아래쪽 어두운 막과 덜 겹치게 사진을 위로 붙입니다. */
export const slideImageTop = style({ objectPosition: 'center top' });
export const carouselButton = style({
  position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: 44, height: 44, padding: 0,
  display: 'flex', alignItems: 'center', justifyContent: 'center', border: 0, borderRadius: '50%',
  backgroundColor: 'rgba(0, 0, 0, 0.6)', color: '#fff', cursor: 'pointer',
  selectors: {
    '&:disabled': { display: 'none' },
    // 사진 색과 상관없이 보이도록 흰 테두리와 검은 그림자를 겹칩니다.
    '&:focus-visible': { outline: '2px solid #fff', outlineOffset: 2, boxShadow: '0 0 0 2px #000' },
  },
});
export const carouselCounter = style({
  position: 'absolute', top: 12, right: 12, padding: '2px 10px', borderRadius: 12,
  backgroundColor: 'rgba(0, 0, 0, 0.7)', color: '#fff', fontSize: 12,
});

export const centered = style({
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  gap: 12, padding: '48px 16px', textAlign: 'center', color: vars.color.muted,
});

// 안내 화면의 링크도 조작 영역을 44px 이상으로 맞춥니다.
globalStyle(`${centered} a`, { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44 });

/** 프로필 링: 인기 게시글 작성자에게 씁니다. */
export const hotRing = style({
  display: 'flex', alignSelf: 'flex-start', flexShrink: 0, padding: 2, borderRadius: '50%',
  backgroundColor: vars.color.accent,
});
export const hotInner = style({ display: 'flex', padding: 1, borderRadius: '50%', backgroundColor: vars.color.surface });
export const official = style({ color: vars.color.official, fontSize: 13, flexShrink: 0 });

export const chipGroup = style({ margin: 0, padding: 0, border: 0, minWidth: 0 });
export const chipLegend = style({ marginBottom: 8, padding: 0 });
export const chips = style({ display: 'flex', flexWrap: 'wrap', gap: 8 });
export const chipInput = style({ position: 'absolute', opacity: 0, width: 1, height: 1 });
export const chip = style({
  display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 44, minHeight: 44, padding: '0 16px', borderRadius: 999, fontWeight: 600,
  border: `1px solid ${vars.color.control}`, color: vars.color.muted, cursor: 'pointer',
  selectors: {
    [`${chipInput}:checked + &`]: { borderColor: vars.color.primary, backgroundColor: vars.color.primary, color: vars.color.onPrimary },
    [`${chipInput}:focus-visible + &`]: { outline: `2px solid ${vars.color.focus}`, outlineOffset: 2 },
    [`${chipInput}:disabled:not(:checked) + &`]: { opacity: 0.55, cursor: 'not-allowed' },
  },
});
