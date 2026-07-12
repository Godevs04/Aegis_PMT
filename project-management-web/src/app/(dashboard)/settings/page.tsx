'use client';

import React from 'react';
import Link from 'next/link';
import { User, Shield, Bell, Layers, Building2, ChevronRight } from 'lucide-react';

const SETTINGS_SECTIONS = [
  {
    title: 'Profile',
    description: 'Manage your name, avatar, bio, timezone, and language.',
    href: '/settings/profile',
    icon: User,
  },
  {
    title: 'Security',
    description: 'Change your password and manage sessions.',
    href: '/settings/security',
    icon: Shield,
  },
  {
    title: 'Notifications',
    description: 'Configure which notifications you receive and how.',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    title: 'Workspace',
    description: 'Edit workspace name, description, and danger zone.',
    href: '/settings/workspace',
    icon: Layers,
  },
];

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account, workspace, and notification preferences.
        </p>
      </div>

      <div className="space-y-2">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon;
          return (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-primary/30 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {section.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
