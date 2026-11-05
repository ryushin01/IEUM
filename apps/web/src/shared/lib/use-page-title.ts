import { useEffect } from 'react';

/** KWCAG 6.4.2 제목 제공 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = `${title} | 이음`;
  }, [title]);
}
