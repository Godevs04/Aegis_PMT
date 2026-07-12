'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Upload, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/services/api-client';

interface ProfileFormValues {
  name: string;
  bio: string;
  timezone: string;
  language: string;
}

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Shanghai',
  'Asia/Kolkata', 'Asia/Dubai', 'Australia/Sydney', 'Pacific/Auckland',
];

export default function ProfileSettingsPage() {
  const { user, setAuth, accessToken } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || '',
      bio: user?.bio || '',
      timezone: user?.timezone || 'UTC',
      language: user?.language || 'en',
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { setError('Avatar must be less than 5MB'); return; }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      if (avatarFile) formData.append('avatar', avatarFile);

      // Update profile (avatar + name)
      await apiClient.patch('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Refresh user data
      const userResponse = await apiClient.get('/users/me');
      const updatedUser = userResponse.data.data;
      if (accessToken) setAuth(updatedUser, accessToken);

      setSuccess('Profile updated successfully.');
      setAvatarFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your personal information and preferences.</p>
      </div>

      {success && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar */}
        <div className="p-6 rounded-xl border border-border bg-card/50 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Avatar</h2>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group h-16 w-16 rounded-full bg-secondary border-2 border-dashed border-border hover:border-primary/50 transition-colors flex items-center justify-center overflow-hidden"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover rounded-full" />
              ) : (
                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              )}
            </button>
            <div>
              <p className="text-xs text-foreground font-medium">Upload a new avatar</p>
              <p className="text-[10px] text-muted-foreground">JPG, PNG, or WebP. Max 5MB.</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </div>
        </div>

        {/* Personal Info */}
        <div className="p-6 rounded-xl border border-border bg-card/50 space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Personal Information</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Min 2 chars' } })} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Input id="bio" placeholder="What do you do?" {...register('bio', { maxLength: { value: 300, message: 'Max 300 chars' } })} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="timezone"><Globe className="inline h-3.5 w-3.5 mr-1" />Timezone</Label>
              <select id="timezone" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" {...register('timezone')}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="language">Language</Label>
              <select id="language" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" {...register('language')}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving && !isDirty && !avatarFile}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
