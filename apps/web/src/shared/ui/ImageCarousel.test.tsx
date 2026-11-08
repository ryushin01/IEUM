import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { ImageCarousel } from './ImageCarousel';

const images = [{ url: 'a.png', alt: '첫째' }, { url: 'b.png', alt: '둘째' }];

it('한 장이면 넘김 버튼을 표시하지 않는다', () => {
  render(<ImageCarousel images={images.slice(0, 1)} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});

it('다음 버튼으로 넘기고 끝에서 비활성화한다', async () => {
  Element.prototype.scrollTo = () => {};
  render(<ImageCarousel images={images} />);
  expect(screen.getByRole('button', { name: '이전 사진', hidden: true })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: '다음 사진' }));
  expect(screen.getByText('2 / 2')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '다음 사진', hidden: true })).toBeDisabled();
});

it('흐린 배경은 장식이라 사진마다 이미지 하나만 낭독한다', () => {
  render(<ImageCarousel images={images} />);
  expect(screen.getAllByRole('img').map((image) => image.getAttribute('alt'))).toEqual(['첫째', '둘째']);
});
