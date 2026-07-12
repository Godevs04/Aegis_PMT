'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api-client';

interface ResetPasswordValues {
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      setError('Reset token is missing. Please use the link from your email.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/auth/reset-password?token=${token}`, {
        password: data.password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The token may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // No token state
  if (!token) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 bg-zinc-950">
        <div className="relative z-10 w-full max-w-md flex flex-col items-center">
          <div className="w-full p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-2xl">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Invalid Link</h2>
              <p className="text-sm text-muted-foreground">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <a href="/forgot-password" className="text-sm text-primary font-medium hover:underline">
                Request New Link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8 select-none">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Aegis</span>
        </div>

        <div className="w-full p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-2xl">
          {isSuccess ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="h-12 w-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Password Reset</h2>
              <p className="text-sm text-muted-foreground">
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <a
                href="/login"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors mt-2"
              >
                Sign In
              </a>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-2 text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Reset Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your new password below
                </p>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      className="pl-10 pr-10"
                      disabled={isSubmitting}
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Password must be at least 8 characters' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      className="pl-10"
                      disabled={isSubmitting}
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) =>
                          value === passwordValue || 'Passwords do not match',
                      })}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
