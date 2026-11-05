import type { Meta, StoryObj } from '@storybook/react-vite';
import { ImageCarousel } from './ImageCarousel';

const pixel = (color: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${color}"/></svg>`)}`;

const meta: Meta<typeof ImageCarousel> = {
  title: 'shared/ImageCarousel',
  component: ImageCarousel,
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
};
export default meta;
export const Single: StoryObj<typeof ImageCarousel> = { args: { images: [{ url: pixel('#c4e538'), alt: '연둣빛 이미지' }] } };
export const Multiple: StoryObj<typeof ImageCarousel> = {
  args: { images: [{ url: pixel('#c4e538'), alt: '연둣빛 이미지' }, { url: pixel('#6a5acd'), alt: '보랏빛 이미지' }] },
};
