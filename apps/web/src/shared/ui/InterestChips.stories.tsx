import type { Meta, StoryObj } from '@storybook/react-vite';
import { InterestChips } from './InterestChips';

const meta: Meta<typeof InterestChips> = { title: 'shared/InterestChips', component: InterestChips, args: { onChange: () => {} } };
export default meta;
export const Empty: StoryObj<typeof InterestChips> = { args: { value: [] } };
export const Full: StoryObj<typeof InterestChips> = { args: { value: ['game', 'movie', 'trip'] } };
