'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    const verifyToken = async () => {
      try {
        await apiClient.post(`/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setMessage(
          err.response?.data?.message || 'Token is invalid or expired.'
        );
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-2xl text-center">
      {status === 'loading' && (
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <h2 className="text-xl font-bold text-white">Verifying email</h2>
          <p className="text-sm text-muted-foreground">
            Please wait while we verify your account...
          </p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
          <h2 className="text-2xl font-bold text-white">Verification successful!</h2>
          <p className="text-sm text-muted-foreground leading-6">
            Your email has been verified. You can now sign in to your Aegis account.
          </p>
          <div className="pt-4 w-full">
            <a href="/login" className="w-full block">
              <Button className="w-full">Sign In</Button>
            </a>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center space-y-4">
          <XCircle className="h-16 w-16 text-destructive" />
          <h2 className="text-2xl font-bold text-white">Verification failed</h2>
          <p className="text-sm text-destructive leading-6">{message}</p>
          <div className="pt-4 w-full">
            <a href="/register" className="w-full block">
              <Button className="w-full" variant="outline">
                Back to Sign Up
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-12 px-4 sm:px-6 lg:px-8 bg-zinc-950">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8 select-none">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/20">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Aegis</span>
        </div>

        <Suspense
          fallback={
            <div className="w-full max-w-md p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-2xl text-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
            </div>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
