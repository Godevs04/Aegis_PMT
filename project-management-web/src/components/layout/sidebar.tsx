'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Zap,
  Calendar,
  Activity,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from 'lucide-react';
import { useSidebar } from './sidebar-context';
import { WorkspaceSwitcher } from './workspace-switcher';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@/services/api-client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
  { label: 'Tasks', href: '/tasks', icon: CheckSquare },
  { label: 'Teams', href: '/teams', icon: Users },
  { label: 'Sprints', href: '/sprints', icon: Zap },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Activity', href: '/activity', icon: Activity },
];

const bottomNavItems: NavItem[] = [
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebar();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Continue with logout even if API fails
    }
    clearAuth();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative z-50 flex flex-col h-full border-r border-border bg-card/80 backdrop-blur-xl
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-[60px]' : 'w-[240px]'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Workspace Switcher */}
        <div className="p-3 border-b border-border">
          <WorkspaceSwitcher />
        </div>

        {/* Search trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={() => {
              // Will trigger command palette (Task 14)
              const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
              document.dispatchEvent(event);
            }}
            className={`
              flex items-center w-full rounded-md border border-border bg-secondary/50
              text-muted-foreground text-xs hover:bg-secondary hover:text-foreground
              transition-colors
              ${isCollapsed ? 'h-8 justify-center' : 'h-8 px-3 gap-2'}
            `}
          >
            <Search className="h-3.5 w-3.5 shrink-0" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Search...</span>
                <kbd className="text-[10px] text-muted-foreground/60 bg-background px-1 rounded border border-border">
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`
                  flex items-center rounded-md text-sm font-medium transition-colors
                  ${isCollapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-3'}
                  ${active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="px-3 py-3 border-t border-border space-y-1">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={`
                  flex items-center rounded-md text-sm font-medium transition-colors
                  ${isCollapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-3'}
                  ${active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}

          {/* User & Logout */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-3 gap-3'} h-9`}>
            {!isCollapsed && user && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Collapse Toggle */}
          <button
            onClick={toggle}
            className={`
              hidden lg:flex items-center rounded-md text-xs text-muted-foreground
              hover:bg-secondary hover:text-foreground transition-colors
              ${isCollapsed ? 'h-9 w-9 justify-center mx-auto' : 'h-9 px-3 gap-3 w-full'}
            `}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
                <kbd className="ml-auto text-[10px] text-muted-foreground/60 bg-background px-1 rounded border border-border">
                  [
                </kbd>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
