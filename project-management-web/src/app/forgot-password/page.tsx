'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api-client';

interface ForgotPasswordValues {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/auth/forgot-password', { email: data.email });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <h2 className="text-xl font-bold text-white">Check Your Email</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an account exists with that email, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
              </p>
              <a
                href="/login"
                className="text-sm text-primary font-medium hover:underline mt-4"
              >
                Back to Sign In
              </a>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-2 text-center mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Forgot Password
                </h1>
                <p className="text-sm text-muted-foreground">
                  Enter your email and we&apos;ll send you a reset link
                </p>
              </div>

              {error && (
                <div className="p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      disabled={isSubmitting}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Please enter a valid email',
                        },
                      })}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <a
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-white inline-flex items-center"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  Back to Sign In
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
