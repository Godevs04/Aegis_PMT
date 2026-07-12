'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Root page — redirects authenticated users to the dashboard (handled by route group),
 * or shows a landing page for unauthenticated visitors.
 */
export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // If authenticated, Next.js will render the (dashboard)/page.tsx via the route group
  // This page only shows for unauthenticated users
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-zinc-950 font-sans text-white">
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

        {/* Header */}
        <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center space-x-2 select-none">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary/20">
              A
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Aegis</span>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign In
            </a>
            <a href="/register" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-white shadow hover:bg-primary/90 transition-colors">
              Get Started
            </a>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center py-20 max-w-4xl mx-auto">
          <div className="inline-flex items-center space-x-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary mb-6">
            <span>Enterprise Project Management Platform</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Manage projects with <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              speed and precision.
            </span>
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground mb-8 leading-8">
            An enterprise-grade SaaS platform built for modern development teams. Track tasks, collaborate on boards, plan sprints, and ship fast.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a href="/register" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-white shadow hover:bg-primary/90 transition-colors">
              Create Account
            </a>
            <a href="/login" className="w-full sm:w-auto inline-flex h-11 items-center justify-center rounded-lg border border-border bg-zinc-900/50 hover:bg-zinc-800/50 px-8 text-sm font-medium text-white transition-colors">
              Sign In to Aegis
            </a>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 py-6 border-t border-border bg-zinc-950/80 backdrop-blur-md text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Aegis. All rights reserved.
        </footer>
      </div>
    );
  }

  // Authenticated — this won't typically render because the (dashboard) route group catches /
  return null;
}
