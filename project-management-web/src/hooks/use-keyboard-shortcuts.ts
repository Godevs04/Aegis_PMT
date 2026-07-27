'use client';

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface Shortcut {
  key: string;
  label: string;
  description: string;
  category: 'navigation' | 'action' | 'view';
  handler: () => void;
}

/**
 * Registers global keyboard shortcuts for the application.
 * Returns the list of registered shortcuts (for the help dialog).
 */
export function useKeyboardShortcuts() {
  const router = useRouter();
  const keySequenceRef = useRef('');
  const sequenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shortcuts: Shortcut[] = useMemo(
    () => [
      // Navigation
      { key: 'g d', label: 'G D', description: 'Go to Dashboard', category: 'navigation', handler: () => router.push('/dashboard') },
      { key: 'g p', label: 'G P', description: 'Go to Projects', category: 'navigation', handler: () => router.push('/projects') },
      { key: 'g t', label: 'G T', description: 'Go to Tasks', category: 'navigation', handler: () => router.push('/tasks') },
      { key: 'g s', label: 'G S', description: 'Go to Sprints', category: 'navigation', handler: () => router.push('/sprints') },
      { key: 'g c', label: 'G C', description: 'Go to Calendar', category: 'navigation', handler: () => router.push('/calendar') },
      { key: 'g a', label: 'G A', description: 'Go to Activity', category: 'navigation', handler: () => router.push('/activity') },
      { key: 'g ,', label: 'G ,', description: 'Go to Settings', category: 'navigation', handler: () => router.push('/settings') },
      // Actions (⌘K and [ already handled by their own providers)
      { key: 'c', label: 'C', description: 'Create new task (quick)', category: 'action', handler: () => router.push('/tasks?create=true') },
    ],
    [router]
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    // Skip if modifier keys are held (those are for ⌘K etc.)
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const key = e.key.toLowerCase();

    // Clear sequence timer
    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);

    // Build sequence
    keySequenceRef.current = keySequenceRef.current
      ? `${keySequenceRef.current} ${key}`
      : key;

    // Check for matching shortcut
    const matched = shortcuts.find((s) => s.key === keySequenceRef.current);
    if (matched) {
      e.preventDefault();
      matched.handler();
      keySequenceRef.current = '';
      return;
    }

    // Check if any shortcut starts with current sequence (keep waiting)
    const hasPrefix = shortcuts.some((s) => s.key.startsWith(keySequenceRef.current));
    if (!hasPrefix) {
      keySequenceRef.current = '';
      return;
    }

    // Set timeout to reset sequence after 1 second
    sequenceTimerRef.current = setTimeout(() => {
      keySequenceRef.current = '';
    }, 1000);
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
