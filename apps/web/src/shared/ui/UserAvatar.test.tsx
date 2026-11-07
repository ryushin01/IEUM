import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { UserAvatar } from './UserAvatar';

it('옆에 닉네임이 있으면 장식으로 처리한다', () => {
  const { container } = render(<UserAvatar nickname="하늘빛" src="/a.png" />);
  expect(container.querySelector('img')).toHaveAttribute('alt', '');
  expect(screen.queryByRole('img')).toBeNull();
});

it('단독으로 쓰면 사진과 대체 글자 모두 이름을 낭독한다', () => {
  const { rerender } = render(<UserAvatar nickname="하늘빛" src="/a.png" decorative={false} />);
  expect(screen.getByRole('img', { name: '하늘빛 님의 프로필 사진' })).toHaveAttribute('src', '/a.png');
  rerender(<UserAvatar nickname="하늘빛" decorative={false} />);
  expect(screen.getByRole('img', { name: '하늘빛 님의 프로필 사진' })).toHaveTextContent('하');
});

it('사진이 없으면 첫 글자를 보여 주고, 인기 글이면 링으로 감싼다', () => {
  const { container, rerender } = render(<UserAvatar nickname="하늘빛" />);
  expect(screen.getByText('하')).toBeInTheDocument();
  const plainDepth = container.querySelectorAll('span').length;
  rerender(<UserAvatar nickname="하늘빛" hot />);
  expect(container.querySelectorAll('span').length).toBe(plainDepth + 2);
});
