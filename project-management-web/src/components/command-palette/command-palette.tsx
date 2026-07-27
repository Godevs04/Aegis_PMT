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
  FileText,
  Tag,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { useWorkspaceStore } from '@/store/workspace-store';
import searchService, { SearchResult } from '@/services/search-service';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: 'navigation' | 'action' | 'search';
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const SEARCH_ICON_MAP: Record<string, React.ElementType> = {
  task: CheckSquare,
  project: FolderKanban,
  member: User,
  comment: MessageSquare,
  label: Tag,
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  if (!isOpen) return null;
  return <CommandPalettePanel key="open" onClose={onClose} />;
}

function CommandPalettePanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { currentWorkspaceId } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useCallback((path: string) => {
    onClose();
    router.push(path);
  }, [onClose, router]);

  const staticCommands: CommandItem[] = [
    { id: 'nav-dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'navigation', action: () => navigate('/dashboard') },
    { id: 'nav-projects', label: 'Projects', icon: FolderKanban, category: 'navigation', action: () => navigate('/projects') },
    { id: 'nav-tasks', label: 'Tasks', icon: CheckSquare, category: 'navigation', action: () => navigate('/tasks') },
    { id: 'nav-teams', label: 'Teams', icon: Users, category: 'navigation', action: () => navigate('/teams') },
    { id: 'nav-sprints', label: 'Sprints', icon: Zap, category: 'navigation', action: () => navigate('/sprints') },
    { id: 'nav-calendar', label: 'Calendar', icon: Calendar, category: 'navigation', action: () => navigate('/calendar') },
    { id: 'nav-activity', label: 'Activity', icon: Activity, category: 'navigation', action: () => navigate('/activity') },
    { id: 'nav-settings', label: 'Settings', icon: Settings, category: 'navigation', action: () => navigate('/settings') },
    { id: 'act-create-project', label: 'Create Project', description: 'Start a new project', icon: Plus, category: 'action', action: () => navigate('/projects?create=true') },
    { id: 'act-create-task', label: 'Create Task', description: 'Add a new task', icon: Plus, category: 'action', action: () => navigate('/tasks?create=true') },
  ];

  const canSearch = query.trim().length >= 2 && !!currentWorkspaceId;

  const searchCommandItems: CommandItem[] = canSearch
    ? searchResults.map((result) => ({
        id: `search-${result.type}-${result.id}`,
        label: result.title,
        description: result.subtitle,
        icon: SEARCH_ICON_MAP[result.type] || FileText,
        category: 'search' as const,
        action: () => {
          if (result.type === 'task') navigate(`/projects/${result.meta?.projectId}`);
          else if (result.type === 'project') navigate(`/projects/${result.id}`);
          else if (result.type === 'member') onClose();
          else if (result.type === 'comment') navigate(`/projects/${result.meta?.projectId}`);
          else onClose();
        },
      }))
    : [];

  const filteredStatic = query.trim()
    ? staticCommands.filter((cmd) =>
        cmd.label.toLowerCase().includes(query.toLowerCase()) ||
        cmd.description?.toLowerCase().includes(query.toLowerCase())
      )
    : staticCommands;

  const flatList = canSearch && searchCommandItems.length > 0
    ? [...searchCommandItems, ...filteredStatic.slice(0, 3)]
    : filteredStatic;

  const safeIndex = flatList.length === 0 ? 0 : Math.min(selectedIndex, flatList.length - 1);

  // Debounced API search — setState only inside async timeout (no sync cascade)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!canSearch || !currentWorkspaceId) return;

    searchTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await searchService.search(query.trim(), currentWorkspaceId, { limit: 10 });
        setSearchResults(response.results);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [query, currentWorkspaceId, canSearch]);

  // Focus input after mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Scroll selected into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [safeIndex]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    if (value.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (flatList.length === 0) return;
        setSelectedIndex((prev) => (prev + 1) % flatList.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (flatList.length === 0) return;
        setSelectedIndex((prev) => (prev - 1 + flatList.length) % flatList.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (flatList[safeIndex]) flatList[safeIndex].action();
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
        <div
          className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center px-4 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Search or type a command..."
              className="flex-1 h-12 px-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />}
            {!isSearching && (
              <kbd className="hidden sm:inline-flex text-[10px] text-muted-foreground/60 bg-secondary px-1.5 py-0.5 rounded border border-border">
                ESC
              </kbd>
            )}
          </div>

          <div ref={listRef} className="max-h-[320px] overflow-y-auto py-2">
            {flatList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">No results found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
              </div>
            ) : (
              <>
                {searchCommandItems.length > 0 && canSearch && (
                  <div>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                      Search Results
                    </p>
                    {searchCommandItems.map((cmd) => {
                      const idx = flatList.indexOf(cmd);
                      return <CommandRow key={cmd.id} item={cmd} isSelected={idx === safeIndex} onSelect={cmd.action} />;
                    })}
                  </div>
                )}

                {filteredStatic.length > 0 && (
                  <div>
                    {searchCommandItems.length > 0 && canSearch && (
                      <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                        Commands
                      </p>
                    )}
                    {(canSearch && searchCommandItems.length > 0 ? filteredStatic.slice(0, 3) : filteredStatic).map((cmd) => {
                      const idx = flatList.indexOf(cmd);
                      return <CommandRow key={cmd.id} item={cmd} isSelected={idx === safeIndex} onSelect={cmd.action} />;
                    })}
                  </div>
                )}
              </>
            )}
          </div>

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

function CommandRow({ item, isSelected, onSelect }: { item: CommandItem; isSelected: boolean; onSelect: () => void }) {
  const Icon = item.icon;
  return (
    <button
      data-selected={isSelected}
      onClick={onSelect}
      className={`flex items-center w-full px-4 py-2 text-sm gap-3 transition-colors ${
        isSelected ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-secondary'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1 text-left min-w-0">
        <span className="font-medium truncate block">{item.label}</span>
        {item.description && <span className="text-xs text-muted-foreground truncate block">{item.description}</span>}
      </div>
      {isSelected && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

export default CommandPalette;
