'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * QueryProvider with optimized caching configuration.
 *
 * Stale time strategy:
 * - Default: 2 minutes (most queries stay fresh for 2 min before background refetch)
 * - Dashboard/analytics: override to 1 min via individual hooks
 * - Notifications: override to 30s via individual hooks
 * - Static data (roles, statuses, priorities): override to 10 min
 *
 * GC time: 10 minutes (keeps data in cache for instant back-navigation)
 * Retry: 2 attempts with exponential backoff
 * Structural sharing: enabled (prevents unnecessary re-renders)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Background refetch control
            staleTime: 2 * 60 * 1000, // 2 minutes — data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes — keep in cache for instant navigation
            refetchOnWindowFocus: true, // Refetch stale data when tab regains focus
            refetchOnReconnect: true, // Refetch when network reconnects

            // Retry with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

            // Structural sharing prevents unnecessary re-renders
            structuralSharing: true,
          },
          mutations: {
            // Retry mutations once on network failure
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;
