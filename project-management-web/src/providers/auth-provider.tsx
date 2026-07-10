'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/services/api-client';
import { Loader2 } from 'lucide-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        // 1. Attempt to refresh token using HTTP-only cookie
        const refreshResponse = await apiClient.post('/auth/refresh');
        const { accessToken } = refreshResponse.data.data;

        // 2. We need to temporarily set accessToken in memory so the /users/me request is authorized
        // (Zustand getState/setState is synchronous, so it is available immediately for the next call)
        useAuthStore.setState({ accessToken });

        // 3. Fetch user profile details
        const userResponse = await apiClient.get('/users/me');
        const user = userResponse.data.data;

        // 4. Save fully authenticated state
        setAuth(user, accessToken);
      } catch (error) {
        // If refresh fails (e.g. no cookie or expired), clear state
        clearAuth();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeSession();
  }, [setAuth, clearAuth]);

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
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
