import { render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TestProviders } from '@/shared/lib/test-providers';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/shared/config');
});

it('일반 빌드에서는 아무것도 그리지 않는다', async () => {
  const { DemoLogin } = await import('./DemoLogin');
  render(<TestProviders><DemoLogin /></TestProviders>);
  expect(screen.queryByRole('region', { name: '데모 둘러보기' })).toBeNull();
  expect(screen.queryByRole('button')).toBeNull();
});

it('데모 빌드에서는 안내와 두 계정 버튼을 보여 준다', async () => {
  vi.resetModules();
  vi.doMock('@/shared/config', async (original) => ({ ...await original<object>(), IS_DEMO: true }));
  const { DemoLogin } = await import('./DemoLogin');
  render(<TestProviders><DemoLogin /></TestProviders>);
  expect(screen.getByRole('region', { name: '데모 둘러보기' })).toHaveTextContent('실제 개인정보는 입력하지 마세요');
  expect(screen.getByRole('button', { name: '데모 계정으로 둘러보기' })).toBeEnabled();
  expect(screen.getByRole('button', { name: '운영자로 둘러보기' })).toBeEnabled();
});
