import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { Logo } from './Logo';

it('그림 하나로 IEUM이라고 낭독하고 크기를 따른다', () => {
  render(<Logo size={32} />);
  expect(screen.getByRole('img', { name: 'IEUM' })).toHaveStyle({ fontSize: '32px' });
});
