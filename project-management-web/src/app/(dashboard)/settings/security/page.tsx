'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api-client';

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecuritySettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<PasswordFormValues>({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPasswordValue = watch('newPassword');

  const onSubmit = async (data: PasswordFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await apiClient.patch('/users/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setSuccess('Password changed successfully. All other sessions have been invalidated.');
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground">Security</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your password and security settings.</p>
      </div>

      {success && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">{success}</div>
      )}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">{error}</div>
      )}

      {/* Change Password */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 rounded-xl border border-border bg-card/50 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Change Password</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="currentPassword"
              type={showPasswords ? 'text' : 'password'}
              placeholder="Enter current password"
              className="pl-10"
              disabled={isSaving}
              {...register('currentPassword', { required: 'Current password is required' })}
            />
          </div>
          {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showPasswords ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className="pl-10"
              disabled={isSaving}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
              })}
            />
          </div>
          {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showPasswords ? 'text' : 'password'}
              placeholder="Re-enter new password"
              className="pl-10"
              disabled={isSaving}
              {...register('confirmPassword', {
                required: 'Please confirm password',
                validate: (value) => value === newPasswordValue || 'Passwords do not match',
              })}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPass"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border"
          />
          <label htmlFor="showPass" className="text-xs text-muted-foreground">Show passwords</label>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</> : 'Update Password'}
          </Button>
        </div>
      </form>

      {/* Sessions Info */}
      <div className="p-6 rounded-xl border border-border bg-card/50 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
        <p className="text-xs text-muted-foreground">
          Changing your password will invalidate all active sessions on other devices. You will need to sign in again.
        </p>
      </div>
    </div>
  );
}
