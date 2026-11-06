import { style } from '@vanilla-extract/css';
import { vars } from '@/shared/theme/theme.css';

export const like = style({
  flex: 1,
  selectors: {
    '&.ant-btn': { minHeight: 48, height: 48, color: vars.color.text, fontWeight: 400 },
    '&.ant-btn[aria-pressed="true"]': { color: vars.color.like, fontWeight: 700 },
  },
});
