'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/services/api-client';
import { Loader2 } from 'lucide-react';

/** Shared across SSR + client first paint — do not diverge these classes. */
const SESSION_SHELL =
  'flex min-h-screen items-center justify-center bg-background text-foreground';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const initializeSession = async () => {
      try {
        const refreshResponse = await apiClient.post('/auth/refresh');
        const { accessToken } = refreshResponse.data.data;
        useAuthStore.setState({ accessToken });

        const userResponse = await apiClient.get('/users/me');
        if (!cancelled) {
          setAuth(userResponse.data.data, accessToken);
        }
      } catch {
        if (!cancelled) clearAuth();
      } finally {
        if (!cancelled) setBootstrapped(true);
      }
    };

    void initializeSession();
    return () => {
      cancelled = true;
    };
  }, [setAuth, clearAuth]);

  // Same tree on server and the client's first paint (avoids hydration mismatch)
  if (!bootstrapped) {
    return (
      <div className={SESSION_SHELL} suppressHydrationWarning>
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground tracking-wider animate-pulse">
            LOADING AEGIS SESSION...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthProvider;
