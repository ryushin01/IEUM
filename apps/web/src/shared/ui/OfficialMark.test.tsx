import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { OfficialMark } from './OfficialMark';

it('아이콘은 숨기고 공식 계정이라고 낭독한다', () => {
  const { container } = render(<OfficialMark />);
  expect(screen.getByText('공식 계정')).toBeInTheDocument();
  expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
});
