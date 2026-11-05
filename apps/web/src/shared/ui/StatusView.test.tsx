import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { ErrorView } from './StatusView';

it.each([
  ['문자열', '이미 가입된 이메일입니다.', '이미 가입된 이메일입니다.'],
  ['Error', new Error('네트워크 오류'), '네트워크 오류'],
  ['그 밖의 값', null, '일시적인 오류가 발생했습니다.'],
])('%s 오류를 안내한다', (_, error, expected) => {
  render(<ErrorView error={error} />);
  expect(screen.getByRole('alert')).toHaveTextContent(expected);
});
