import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const section = style({});
export const divider = style({ marginBottom: 12, textAlign: 'center', color: vars.color.muted });
export const list = style({ display: 'grid', gap: 8 });
export const error = style({ marginTop: 12 });

const base = {
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 48,
  borderRadius: 10, fontFamily: `-apple-system, 'Apple SD Gothic Neo', Roboto, 'Noto Sans KR', sans-serif`,
  fontSize: 15, fontWeight: 500, cursor: 'pointer',
  selectors: { '&:disabled': { opacity: 0.6, cursor: 'wait' } },
} as const;

/** 각 제공자의 공식 색상입니다. 네이버는 글자 대비를 위해 흰 바탕 버튼을 씁니다. */
export const button = styleVariants({
  kakao: { ...base, border: 0, backgroundColor: '#fee500', color: 'rgba(0, 0, 0, 0.85)' },
  naver: { ...base, border: '1px solid #03c75a', backgroundColor: '#ffffff', color: '#1f1f1f' },
  google: { ...base, border: '1px solid #747775', backgroundColor: '#ffffff', color: '#1f1f1f' },
  // 어두운 화면에서는 Apple 가이드의 흰 버튼을 씁니다.
  apple: {
    ...base,
    border: '1px solid #000000',
    backgroundColor: '#000000',
    color: '#ffffff',
    selectors: {
      ...base.selectors,
      '[data-theme="dark"] &': { borderColor: '#ffffff', backgroundColor: '#ffffff', color: '#000000' },
    },
  },
});
export const demoNote = style({ marginBottom: 12, textAlign: 'center', fontSize: 14, color: vars.color.muted });
