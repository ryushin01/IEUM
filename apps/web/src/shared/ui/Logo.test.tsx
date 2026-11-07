import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Logo } from './Logo';

it('글자로 읽히고 점은 낭독하지 않는다', () => {
  const { container } = render(<Logo size={32} />);
  expect(screen.getByText('IEUM')).toHaveStyle({ fontSize: '32px' });
  expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
});
