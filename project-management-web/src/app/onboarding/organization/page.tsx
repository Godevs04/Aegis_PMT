'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Loader2, Building2, Users, Check, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/services/api-client';

type Mode = 'choose' | 'create' | 'join';

interface CreateOrgValues {
  name: string;
  description: string;
}

interface JoinOrgValues {
  token: string;
}

export default function OnboardingOrganizationPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createForm = useForm<CreateOrgValues>({
    defaultValues: { name: '', description: '' },
  });

  const joinForm = useForm<JoinOrgValues>({
    defaultValues: { token: '' },
  });

  const handleCreateOrg = async (data: CreateOrgValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post('/organizations', {
        name: data.name,
        description: data.description,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create organization.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinOrg = async (data: JoinOrgValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiClient.post(`/organizations/join/${data.token}`);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired invitation token.');
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
            <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-sm font-medium">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">Profile</span>
          </div>
          <div className="h-px w-8 bg-primary/40" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-white">Organization</span>
          </div>
          <div className="h-px w-8 bg-border" />
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground text-sm font-medium">
              <Check className="h-4 w-4" />
            </div>
            <span className="text-sm text-muted-foreground">Done</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-md shadow-2xl">
          {error && (
            <div className="p-3 mb-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Choose Mode */}
          {mode === 'choose' && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Set Up Your Organization
                </h1>
                <p className="text-sm text-muted-foreground">
                  Create a new organization or join an existing one
                </p>
              </div>

              <div className="grid gap-4">
                {/* Create New */}
                <button
                  type="button"
                  onClick={() => { setMode('create'); setError(null); }}
                  className="group relative w-full p-5 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="h-11 w-11 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">
                        Create New Organization
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Start fresh with your own organization. You can invite team members later.
                      </p>
                    </div>
                  </div>
                </button>

                {/* Join Existing */}
                <button
                  type="button"
                  onClick={() => { setMode('join'); setError(null); }}
                  className="group relative w-full p-5 rounded-xl border border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50 transition-all text-left"
                >
                  <div className="flex items-start space-x-4">
                    <div className="h-11 w-11 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">
                        Join Existing Organization
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Have an invitation token? Enter it to join your team.
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Create Organization Form */}
          {mode === 'create' && (
            <div className="space-y-5">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => { setMode('choose'); setError(null); }}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white">Create Organization</h2>
                  <p className="text-xs text-muted-foreground">This will also create your first workspace</p>
                </div>
              </div>

              <form onSubmit={createForm.handleSubmit(handleCreateOrg)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g. Acme Corp"
                    disabled={isSubmitting}
                    {...createForm.register('name', {
                      required: 'Organization name is required',
                      minLength: { value: 2, message: 'Must be at least 2 characters' },
                    })}
                  />
                  {createForm.formState.errors.name && (
                    <p className="text-xs text-destructive">{createForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="orgDescription">Description (optional)</Label>
                  <Input
                    id="orgDescription"
                    placeholder="What does your organization do?"
                    disabled={isSubmitting}
                    {...createForm.register('description', {
                      maxLength: { value: 500, message: 'Cannot exceed 500 characters' },
                    })}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Organization'
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Join Organization Form */}
          {mode === 'join' && (
            <div className="space-y-5">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => { setMode('choose'); setError(null); }}
                  className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary/50 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-white">Join Organization</h2>
                  <p className="text-xs text-muted-foreground">Enter the invitation token you received</p>
                </div>
              </div>

              <form onSubmit={joinForm.handleSubmit(handleJoinOrg)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="token">Invitation Token</Label>
                  <Input
                    id="token"
                    placeholder="Paste your invitation token here"
                    disabled={isSubmitting}
                    {...joinForm.register('token', {
                      required: 'Invitation token is required',
                    })}
                  />
                  {joinForm.formState.errors.token && (
                    <p className="text-xs text-destructive">{joinForm.formState.errors.token.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Organization'
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
