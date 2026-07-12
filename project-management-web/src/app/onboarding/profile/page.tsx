'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Upload, User, Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api-client';
import { useAuthStore } from '@/store/auth-store';

interface ProfileFormValues {
  name: string;
  bio: string;
  timezone: string;
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Australia/Sydney',
  'Pacific/Auckland',
];

export default function OnboardingProfilePage() {
  const router = useRouter();
  const { user, setAuth, accessToken } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || '',
      bio: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Avatar file must be less than 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('bio', data.bio);
      formData.append('timezone', data.timezone);
      formData.append('language', 'en');

      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await apiClient.post('/users/complete-profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = response.data.data;

      // Update auth store with new user data
      if (accessToken) {
        setAuth(updatedUser, accessToken);
      }

      // Navigate to organization step
      router.push('/onboarding/organization');
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to complete profile. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-6 select-none">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Aegis</span>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              <User className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">Profile</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-medium">
              2
            </div>
            <span className="text-sm text-muted-foreground">Organization</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-medium">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">Done</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="w-full p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col space-y-2 text-center mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Complete Your Profile
            </h1>
            <p className="text-sm text-muted-foreground">
              Tell us a bit about yourself to personalize your experience
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="relative group h-20 w-20 rounded-full bg-secondary border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden"
              >
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Upload className="h-5 w-5 text-white" />
                </div>
              </button>
              <p className="text-xs text-muted-foreground">Upload avatar (optional)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                disabled={isSubmitting}
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio (optional)</Label>
              <Input
                id="bio"
                placeholder="What do you do? e.g. Senior Frontend Engineer"
                disabled={isSubmitting}
                {...register('bio', {
                  maxLength: { value: 300, message: 'Bio cannot exceed 300 characters' },
                })}
              />
              {errors.bio && (
                <p className="text-xs text-destructive">{errors.bio.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <Label htmlFor="timezone">
                <Globe className="inline h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Timezone
              </Label>
              <select
                id="timezone"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
                {...register('timezone')}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
