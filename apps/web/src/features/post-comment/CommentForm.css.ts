import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ flex: 1, minWidth: 0 });
/** 입력칸과 게시 버튼을 하나의 알약으로 묶습니다. */
export const row = style({
  display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 6px 0 8px',
  border: `1px solid ${vars.color.control}`, borderRadius: 999, backgroundColor: vars.color.surface,
  selectors: { '&:focus-within': { outline: `2px solid ${vars.color.focus}`, outlineOffset: -1 } },
});
globalStyle(`${row} input.ant-input:focus-visible`, { outline: 'none' });
export const submit = style({
  selectors: {
    '&.ant-btn:not(:disabled)': { color: vars.color.primary, fontWeight: 600 },
    // 비활성 버튼도 무엇인지 읽을 수 있게 보조 글자 대비를 유지합니다.
    '&.ant-btn:disabled': { color: vars.color.muted },
  },
});
export const error = style({ marginTop: 8 });
