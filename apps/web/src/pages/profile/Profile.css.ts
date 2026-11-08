import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const head = style({ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12, padding: '20px 16px 16px', backgroundColor: vars.color.surface });
export const info = style({ width: '100%', minWidth: 0 });
export const name = style({ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', overflowWrap: 'anywhere' });
export const bio = style({ marginTop: 4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: vars.color.muted });
export const count = style({ marginTop: 4, color: vars.color.muted });
export const countValue = style({ color: vars.color.text, fontWeight: 700 });
export const actions = style({ display: 'flex', gap: 8, padding: '0 16px 16px', backgroundColor: vars.color.surface });
export const posts = style({ marginTop: 8, backgroundColor: vars.color.surface });
/** 흰 짧은 밑줄이 있는 탭 모양의 제목입니다. 고를 수 있는 탭은 아니므로 제목 요소로 둡니다. */
export const postsTitle = style({
  position: 'relative', margin: '0 16px', padding: '14px 0', borderBottom: `1px solid ${vars.color.border}`, fontSize: 15, fontWeight: 600,
  selectors: { '&::after': { content: '""', position: 'absolute', left: 0, bottom: -1, width: 56, height: 2, backgroundColor: vars.color.text } },
});
export const tabs = style({ marginTop: 8 });
// 탭을 폭 전체로 나누고, 고른 탭은 색 말고 굵기와 밑줄로도 구분합니다.
globalStyle(`${tabs} .ant-tabs-nav-list`, { width: '100%' });
globalStyle(`${tabs} .ant-tabs-tab`, { flex: 1, padding: 0 });
// 초점을 받는 요소가 안쪽 글자라서 여기를 44px로 키웁니다. (KWCAG 6.1.3)
globalStyle(`${tabs} .ant-tabs-tab-btn`, { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 44 });
globalStyle(`${tabs} .ant-tabs-tab-active .ant-tabs-tab-btn`, { fontWeight: 600 });
export const grid = style({ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, marginTop: 2 });
export const gridLink = style({ display: 'block', aspectRatio: '1 / 1', overflow: 'hidden', backgroundColor: vars.color.accentSoft });
export const gridImage = style({ width: '100%', height: '100%', objectFit: 'cover' });
export const interests = style({ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 });
export const interest = style({ padding: '4px 12px', borderRadius: 999, backgroundColor: vars.color.accentSoft, color: vars.color.onAccentSoft, fontSize: 13, fontWeight: 500 });
