'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/auth-store';

/**
 * Applies the authenticated user's saved theme preference once when session loads.
 * Does not override manual toggles after that.
 */
export function ThemeSync() {
  const { setTheme } = useTheme();
  const userId = useAuthStore((s) => s.user?.id);
  const userTheme = useAuthStore((s) => s.user?.theme);
  const appliedForUser = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!userId || !userTheme) return;
    if (appliedForUser.current === userId) return;
    if (userTheme === 'light' || userTheme === 'dark' || userTheme === 'system') {
      setTheme(userTheme);
      appliedForUser.current = userId;
    }
  }, [userId, userTheme, setTheme]);

  React.useEffect(() => {
    if (!userId) appliedForUser.current = null;
  }, [userId]);

  return null;
}

export default ThemeSync;
