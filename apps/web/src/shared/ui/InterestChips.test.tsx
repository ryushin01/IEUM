import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { expect, it } from 'vitest';
import { InterestChips } from './InterestChips';

function Harness() {
  const [value, setValue] = useState<string[]>([]);
  return <InterestChips value={value} onChange={setValue} />;
}

it('3개를 고르면 나머지는 비활성화되고, 해제하면 다시 고를 수 있다', async () => {
  render(<Harness />);
  for (const name of ['게임', '영화', '맛집']) await userEvent.click(screen.getByRole('checkbox', { name }));
  expect(screen.getByRole('group', { name: /3개 선택/ })).toBeInTheDocument();
  expect(screen.getByRole('checkbox', { name: '음악' })).toBeDisabled();
  await userEvent.click(screen.getByRole('checkbox', { name: '영화' }));
  expect(screen.getByRole('checkbox', { name: '음악' })).toBeEnabled();
});
