export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
  bio?: string;
  timezone?: string;
  language?: string;
  theme?: 'dark' | 'light' | 'system';
  isOnboardingComplete?: boolean;
  onboardingStep?: number;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface OnboardingStatus {
  isOnboardingComplete: boolean;
  onboardingStep: number;
  hasOrganization: boolean;
  profile: {
    name: string;
    bio?: string;
    avatarUrl?: string;
    timezone?: string;
  };
}
