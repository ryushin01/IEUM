import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const form = style({ flex: 1, minWidth: 0 });
/** 입력칸과 게시 버튼을 밑줄 하나로 묶습니다. */
export const row = style({
  display: 'flex', alignItems: 'center', minHeight: 44,
  borderBottom: `1px solid ${vars.color.control}`,
  selectors: { '&:focus-within': { boxShadow: `inset 0 -2px 0 ${vars.color.focus}` } },
});
globalStyle(`${row} input.ant-input`, { paddingInline: 0 });
globalStyle(`${row} input.ant-input:focus-visible`, { outline: 'none' });
export const submit = style({
  selectors: {
    '&.ant-btn:not(:disabled)': { color: vars.color.primary, fontWeight: 600 },
    // 비활성 버튼도 무엇인지 읽을 수 있게 보조 글자 대비를 유지합니다.
    '&.ant-btn:disabled': { color: vars.color.muted },
  },
});
export const error = style({ marginTop: 8 });
