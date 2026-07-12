'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { OnboardingGuard } from '@/components/guards';
import { SidebarProvider } from '@/components/layout/sidebar-context';
import { CommandPaletteProvider } from '@/components/command-palette';
import { SocketProvider } from '@/providers/socket-provider';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { ErrorBoundary } from '@/components/error-boundary';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <OnboardingGuard>
        <SocketProvider>
          <SidebarProvider>
            <CommandPaletteProvider>
              <KeyboardShortcutsDialog />
              <div className="flex h-screen overflow-hidden bg-background">
                {/* Sidebar */}
                <Sidebar />

                {/* Main Content Area */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  {/* Header */}
                  <Header />

                  {/* Page Content — wrapped in its own ErrorBoundary for page-level errors */}
                  <main className="flex-1 overflow-y-auto p-6">
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </main>
                </div>
              </div>
            </CommandPaletteProvider>
          </SidebarProvider>
        </SocketProvider>
      </OnboardingGuard>
    </ErrorBoundary>
  );
}
