import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { setThemeMode } from '@/shared/theme';
import { ThemeSwitch } from './ThemeSwitch';

describe('ThemeSwitch', () => {
  afterEach(() => setThemeMode('light'));

  it('누르면 다크 모드를 켜고 끈다', async () => {
    setThemeMode('light');
    render(<ThemeSwitch />);
    const toggle = screen.getByRole('switch', { name: '다크 모드' });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('브라우저 주소창 색을 헤더 색에 맞춘다', () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
    setThemeMode('dark');
    expect(meta).toHaveAttribute('content', '#111214');
    setThemeMode('light');
    expect(meta).toHaveAttribute('content', '#ffffff');
    meta.remove();
  });

  it('스페이스와 엔터로 전환한다', async () => {
    setThemeMode('light');
    render(<ThemeSwitch />);
    const toggle = screen.getByRole('switch', { name: '다크 모드' });
    toggle.focus();
    await userEvent.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    await userEvent.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('콘텐츠 모델을 지켜 button 안에 div를 두지 않는다', () => {
    render(<ThemeSwitch />);
    expect(screen.getByRole('switch').querySelector('div')).toBeNull();
  });
});
