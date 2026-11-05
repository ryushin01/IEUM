import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const like = style({
  selectors: {
    '&.ant-btn': { minHeight: 44, height: 44, padding: '0 16px', borderRadius: 999, backgroundColor: vars.color.bg, color: vars.color.text, fontWeight: 800 },
    '&.ant-btn[aria-pressed="true"]': { backgroundColor: vars.color.likeSoft, color: vars.color.like },
  },
});
