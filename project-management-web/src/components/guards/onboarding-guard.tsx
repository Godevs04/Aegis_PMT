'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/services/api-client';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/login', '/register', '/verify-email', '/forgot-password', '/reset-password'];
const ONBOARDING_PATHS = ['/onboarding/profile', '/onboarding/organization'];

/**
 * OnboardingGuard
 *
 * Flow (first signup only):
 * 1. Not authenticated → /login
 * 2. Profile incomplete → /onboarding/profile
 * 3. No organization → /onboarding/organization
 * 4. Has organization → allow app (bounce off onboarding pages)
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user, setAuth, accessToken } = useAuthStore();
  const [gate, setGate] = useState<{ checking: boolean; allowed: boolean }>({
    checking: true,
    allowed: false,
  });

  useEffect(() => {
    let cancelled = false;

    const checkOnboarding = async () => {
      if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        if (!cancelled) setGate({ checking: false, allowed: true });
        return;
      }

      if (isLoading) return;

      if (!isAuthenticated || !user) {
        router.replace('/login');
        return;
      }

      try {
        const response = await apiClient.get('/users/onboarding-status');
        const status = response.data.data as {
          isOnboardingComplete?: boolean;
          isFullyOnboarded?: boolean;
          hasOrganization?: boolean;
          needsProfile?: boolean;
          needsOrganization?: boolean;
        };

        if (cancelled) return;

        const needsProfile = status.needsProfile ?? !status.isOnboardingComplete;
        const needsOrganization =
          status.needsOrganization ?? !status.hasOrganization;
        const fullyOnboarded =
          status.isFullyOnboarded ?? !!status.hasOrganization;

        if (fullyOnboarded && accessToken && !user.isOnboardingComplete) {
          const me = await apiClient.get('/users/me');
          if (!cancelled) setAuth(me.data.data, accessToken);
        }

        const onOnboardingPage = ONBOARDING_PATHS.some((p) => pathname.startsWith(p));

        if (fullyOnboarded) {
          if (onOnboardingPage) {
            router.replace('/dashboard');
            return;
          }
          if (!cancelled) setGate({ checking: false, allowed: true });
          return;
        }

        if (needsProfile && !pathname.startsWith('/onboarding/profile')) {
          router.replace('/onboarding/profile');
          return;
        }

        if (
          !needsProfile &&
          needsOrganization &&
          !pathname.startsWith('/onboarding/organization')
        ) {
          router.replace('/onboarding/organization');
          return;
        }

        if (!cancelled) setGate({ checking: false, allowed: true });
      } catch {
        if (!cancelled) setGate({ checking: false, allowed: true });
      }
    };

    checkOnboarding();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, user, pathname, router, accessToken, setAuth]);

  if (isLoading || gate.checking) {
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return <>{children}</>;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground tracking-wider">
            Checking account status...
          </p>
        </div>
      </div>
    );
  }

  if (!gate.allowed) {
    return null;
  }

  return <>{children}</>;
}

export default OnboardingGuard;
