import type { Meta, StoryObj } from '@storybook/react-vite';
import { DemoLogin } from './DemoLogin';

/** 데모 빌드에서만 나타납니다. 일반 빌드의 Storybook에서는 아무것도 그리지 않습니다. 화면은 데모 E2E에서 확인합니다. */
const meta: Meta<typeof DemoLogin> = { title: 'features/DemoLogin', component: DemoLogin };
export default meta;
export const OutsideDemo: StoryObj<typeof DemoLogin> = {};
