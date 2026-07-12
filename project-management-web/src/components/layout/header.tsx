'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Bell, Menu, Search } from 'lucide-react';
import { useSidebar } from './sidebar-context';
import { useAuthStore } from '@/store/auth-store';
import { useUnreadCountQuery } from '@/hooks/use-notifications';

/**
 * Breadcrumb mapping from pathname segments to human-readable labels.
 */
const BREADCRUMB_LABELS: Record<string, string> = {
  '': 'Dashboard',
  projects: 'Projects',
  tasks: 'Tasks',
  teams: 'Teams',
  sprints: 'Sprints',
  calendar: 'Calendar',
  activity: 'Activity',
  settings: 'Settings',
};

export function Header() {
  const pathname = usePathname();
  const { toggleMobile } = useSidebar();
  const { user } = useAuthStore();
  const { data: unreadCount } = useUnreadCountQuery();

  // Generate breadcrumbs from pathname
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs = segments.length === 0
    ? [{ label: 'Dashboard', href: '/' }]
    : segments.map((segment, index) => ({
        label: BREADCRUMB_LABELS[segment] || segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        href: '/' + segments.slice(0, index + 1).join('/'),
      }));

  return (
    <header className="h-14 shrink-0 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={toggleMobile}
        className="lg:hidden h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex-1 flex items-center min-w-0">
        <ol className="flex items-center space-x-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.href} className="flex items-center">
              {index > 0 && (
                <span className="mx-1.5 text-muted-foreground/40">/</span>
              )}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-foreground truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <a
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[150px]"
                >
                  {crumb.label}
                </a>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true });
            document.dispatchEvent(event);
          }}
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notification bell */}
        <button
          className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Unread indicator dot */}
          {(unreadCount ?? 0) > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-primary text-[7px] font-bold text-white flex items-center justify-center">
              {unreadCount && unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all"
          title={user?.name || 'Profile'}
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-full w-full object-cover rounded-full"
            />
          ) : (
            <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
          )}
        </button>
      </div>
    </header>
  );
}
