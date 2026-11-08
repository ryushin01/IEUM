import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

/** 카드 없이 한 면에 두고 머리카락 굵기의 선으로만 나눕니다. */
export const card = style({ padding: '14px 16px 16px', borderBottom: `1px solid ${vars.color.border}`, backgroundColor: vars.color.surface });
export const header = style({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 });
export const author = style({ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, minWidth: 0, textDecoration: 'none' });
export const names = style({ display: 'flex', flexDirection: 'column', minWidth: 0 });
export const nameRow = style({ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 });
export const nickname = style({ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const date = style({ fontSize: 12, color: vars.color.muted });
export const caption = style({ padding: '8px 0 12px', fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' });
export const captionClamp = style({ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' });
export const stats = style({ padding: '10px 0', fontSize: 13, color: vars.color.muted });
export const actions = style({ display: 'flex', alignItems: 'stretch' });

const WIDE = 'screen and (min-width: 768px)';
/** 글자가 시작하기 전에 막이 충분히 어두워지는 높이입니다. 흰 사진 위에서도 글자 대비 4.5:1을 넘깁니다. */
const FADE = 64;

/** 헤더와 하단 메뉴를 뺀 화면 한 장입니다. 글자를 키운 좁은 화면에서도 잘리지 않게 최소 높이를 둡니다. */
export const immersive = style({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr) auto', minHeight: 420,
  height: `calc(100dvh - ${vars.layout.header} - ${vars.layout.nav})`, backgroundColor: vars.color.surface,
  scrollSnapAlign: 'start', scrollSnapStop: 'always',
  '@media': { [WIDE]: { height: '100dvh' } },
});
export const media = style({ gridArea: '1 / 1', minHeight: 0, minWidth: 0 });
export const overlay = style({
  gridArea: '1 / 1', alignSelf: 'end', zIndex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: 240, minWidth: 0,
  padding: `${FADE}px 72px 16px 16px`, color: vars.color.text, pointerEvents: 'none',
  backgroundImage: `linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.7) ${FADE}px, rgba(0, 0, 0, 0.8))`,
});
// 막 위에서 사진을 넘길 수 있게 링크만 누를 수 있습니다.
globalStyle(`${overlay} a`, { pointerEvents: 'auto' });
globalStyle(`${overlay} time, ${overlay} p`, { color: vars.color.text });
export const rail = style({ gridArea: '1 / 1', alignSelf: 'end', justifySelf: 'end', zIndex: 2, display: 'flex', flexDirection: 'column', width: 64, paddingBottom: 8 });
globalStyle(`${rail} button.ant-btn, ${rail} a`, {
  display: 'flex', flex: 'none', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, width: 64, height: 'auto', minHeight: 56,
  padding: 0, color: vars.color.text, fontSize: 11, lineHeight: 1.2, textDecoration: 'none',
});
// 사진 위라 색 대신 채운 아이콘과 글자 굵기로 눌린 상태를 보여 줍니다.
globalStyle(`${rail} button.ant-btn[aria-pressed="true"]`, { color: vars.color.text });
globalStyle(`${rail} button.ant-btn:hover`, { backgroundColor: 'rgba(255, 255, 255, 0.12)' });
globalStyle(`${rail} .anticon`, { fontSize: 24 });
