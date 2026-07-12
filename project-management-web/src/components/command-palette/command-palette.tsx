'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Zap,
  Calendar,
  Activity,
  Settings,
  Plus,
  Search,
  ArrowRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: 'navigation' | 'action' | 'recent';
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define commands
  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'navigation', action: () => navigate('/'), keywords: ['home', 'overview'] },
    { id: 'nav-projects', label: 'Projects', icon: FolderKanban, category: 'navigation', action: () => navigate('/projects'), keywords: ['project', 'board'] },
    { id: 'nav-tasks', label: 'Tasks', icon: CheckSquare, category: 'navigation', action: () => navigate('/tasks'), keywords: ['task', 'todo', 'issues'] },
    { id: 'nav-teams', label: 'Teams', icon: Users, category: 'navigation', action: () => navigate('/teams'), keywords: ['team', 'members', 'people'] },
    { id: 'nav-sprints', label: 'Sprints', icon: Zap, category: 'navigation', action: () => navigate('/sprints'), keywords: ['sprint', 'iteration', 'cycle'] },
    { id: 'nav-calendar', label: 'Calendar', icon: Calendar, category: 'navigation', action: () => navigate('/calendar'), keywords: ['calendar', 'schedule', 'dates'] },
    { id: 'nav-activity', label: 'Activity', icon: Activity, category: 'navigation', action: () => navigate('/activity'), keywords: ['activity', 'feed', 'log'] },
    { id: 'nav-settings', label: 'Settings', icon: Settings, category: 'navigation', action: () => navigate('/settings'), keywords: ['settings', 'preferences', 'config'] },
    { id: 'nav-workspace-settings', label: 'Workspace Settings', icon: Settings, category: 'navigation', action: () => navigate('/settings/workspace'), keywords: ['workspace', 'settings'] },
    // Actions
    { id: 'act-create-project', label: 'Create Project', description: 'Start a new project', icon: Plus, category: 'action', action: () => navigate('/projects?create=true'), keywords: ['new', 'create', 'project'] },
    { id: 'act-create-task', label: 'Create Task', description: 'Add a new task', icon: Plus, category: 'action', action: () => navigate('/tasks?create=true'), keywords: ['new', 'create', 'task', 'add'] },
    { id: 'act-invite-member', label: 'Invite Member', description: 'Invite someone to workspace', icon: Users, category: 'action', action: () => navigate('/settings/workspace'), keywords: ['invite', 'member', 'add', 'people'] },
  ];

  // Filter commands based on query
  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const searchLower = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some((kw) => kw.includes(searchLower))
        );
      })
    : commands;

  // Group by category
  const grouped = {
    navigation: filteredCommands.filter((c) => c.category === 'navigation'),
    action: filteredCommands.filter((c) => c.category === 'action'),
  };

  const flatList = [...grouped.action, ...grouped.navigation];

  const navigate = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Ensure selected item is visible
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flatList.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + flatList.length) % flatList.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (flatList[selectedIndex]) {
          flatList[selectedIndex].action();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
        <div
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 h-12 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded border border-border">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                {/* Actions */}
                {grouped.action.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Actions
                    </p>
                    {grouped.action.map((cmd) => {
                      const globalIndex = flatList.indexOf(cmd);
                      return (
                        <CommandRow
                          key={cmd.id}
                          item={cmd}
                          isSelected={globalIndex === selectedIndex}
                          onSelect={() => cmd.action()}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Navigation */}
                {grouped.navigation.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Navigation
                    </p>
                    {grouped.navigation.map((cmd) => {
                      const globalIndex = flatList.indexOf(cmd);
                      return (
                        <CommandRow
                          key={cmd.id}
                          item={cmd}
                          isSelected={globalIndex === selectedIndex}
                          onSelect={() => cmd.action()}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[10px] text-muted-foreground/60">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="bg-secondary px-1 py-0.5 rounded border border-border">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-secondary px-1 py-0.5 rounded border border-border">↵</kbd>
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="bg-secondary px-1 py-0.5 rounded border border-border">esc</kbd>
                Close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Command Row ─────────────────────────────────────────────────────────────

function CommandRow({
  item,
  isSelected,
  onSelect,
}: {
  item: CommandItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      data-selected={isSelected}
      onClick={onSelect}
      className={`
        flex items-center w-full px-4 py-2 text-sm gap-3 transition-colors
        ${isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'}
      `}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 text-left min-w-0">
        <span className="font-medium">{item.label}</span>
        {item.description && (
          <span className="ml-2 text-xs text-muted-foreground">{item.description}</span>
        )}
      </div>
      {isSelected && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

export default CommandPalette;
