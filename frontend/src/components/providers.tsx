import type React from 'react';
import { useEffect } from 'react';

import { ThemeProvider } from '@/components/theme-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  /* NEW: global handler to silence Chrome ResizeObserver dev error */
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (
        event.message ===
          'ResizeObserver loop completed with undelivered notifications.' ||
        event.message === 'ResizeObserver loop limit exceeded'
      ) {
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);
  return <ThemeProvider defaultTheme="light">{children}</ThemeProvider>;
}
