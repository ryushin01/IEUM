import fsd from '@feature-sliced/steiger-plugin';
import { defineConfig } from 'steiger';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      // 슬라이스가 작아 파일을 ui, model로 나누지 않고 평평하게 둡니다.
      'fsd/no-segmentless-slices': 'off',
      // 실제로 쓰는 entities/post, features/report-review까지 참조가 없다고 잘못 보고합니다.
      'fsd/insignificant-slice': 'off',
    },
  },
  {
    // vanilla-extract는 빌드 시 실행되어 공개 API의 리액트 코드를 불러오면 안 됩니다.
    files: ['./src/**/*.css.ts', './src/app/main.tsx'],
    rules: { 'fsd/no-public-api-sidestep': 'off' },
  },
  {
    // 데모 서버는 운영 번들에 들어가지 않도록 동적으로만 불러와 공개 API에 넣지 않습니다.
    files: ['./src/app/native-bridge.ts', './src/pages/settings/**'],
    rules: { 'fsd/no-public-api-sidestep': 'off' },
  },
  {
    // FSD 문서의 예시와 같은 이름입니다.
    files: ['./src/app/providers/**'],
    rules: { 'fsd/segments-by-purpose': 'off' },
  },
]);
