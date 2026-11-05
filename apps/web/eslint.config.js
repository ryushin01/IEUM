import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

// FSD: 슬라이스는 아래 계층만, 다른 슬라이스는 공개 API로만 가져옵니다.
const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const fsdRules = layers.slice(1).flatMap((layer, index) => {
  const upper = layers.slice(0, index + 1);
  const same = layer === 'shared' ? [] : [`@/${layer}/*`];
  return [
    {
      files: [`src/${layer}/**/*.{ts,tsx}`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [{ group: [...upper.map((u) => `@/${u}/*`), ...same], message: 'FSD 계층 규칙 위반입니다.' }] },
        ],
      },
    },
  ];
});

export default tseslint.config(
  { ignores: ['dist', 'storybook-static', 'playwright-report', 'test-results'] },
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: { 'react-hooks/rules-of-hooks': 'error', 'react-hooks/exhaustive-deps': 'error' },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@/*/*/*', '!@/shared/*/*'], message: '슬라이스는 공개 API(index.ts)로 가져옵니다.' }] },
      ],
    },
  },
  ...fsdRules,
);
