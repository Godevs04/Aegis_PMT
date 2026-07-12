'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/services/api-client';
import { Loader2 } from 'lucide-react';

/**
 * OnboardingGuard
 *
 * Wraps authenticated pages and redirects users to the correct onboarding step
 * if they haven't completed setup. Also prevents onboarded users from accessing
 * the onboarding pages.
 *
 * Flow:
 * 1. Not authenticated → redirect to /login
 * 2. Authenticated but profile not complete → redirect to /onboarding/profile
 * 3. Authenticated, profile complete, no organization → redirect to /onboarding/organization
 * 4. Fully onboarded → allow access to app
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  // Pages that don't require onboarding completion
  const publicPaths = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
  const onboardingPaths = ['/onboarding/profile', '/onboarding/organization'];

  useEffect(() => {
    const checkOnboarding = async () => {
      // Skip guard for public pages
      if (publicPaths.some((p) => pathname.startsWith(p))) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // Wait for auth to initialize
      if (isLoading) return;

      // Not authenticated → login
      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }

      // If user is on an onboarding page, allow it (they're in the flow)
      if (onboardingPaths.some((p) => pathname.startsWith(p))) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // Check onboarding status from user object (already fetched via /users/me)
      if (!user.isOnboardingComplete) {
        router.replace('/onboarding/profile');
        return;
      }

      // Profile is complete — check if they have an organization
      try {
        const response = await apiClient.get('/users/onboarding-status');
        const status = response.data.data;

        if (!status.hasOrganization) {
          router.replace('/onboarding/organization');
          return;
        }

        // Fully onboarded — allow access
        setIsAllowed(true);
      } catch {
        // If the check fails, allow access (don't block the user)
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [isAuthenticated, isLoading, user, pathname, router]);

  // Show loading while checking
  if (isLoading || isChecking) {
    // Don't show loader for public paths
    if (publicPaths.some((p) => pathname.startsWith(p))) {
      return <>{children}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground tracking-wider">
            Checking account status...
          </p>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

export default OnboardingGuard;
