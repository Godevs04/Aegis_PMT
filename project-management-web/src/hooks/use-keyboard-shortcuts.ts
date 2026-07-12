'use client';

import { useEffect, useCallback } from 'react';
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

  const shortcuts: Shortcut[] = [
    // Navigation
    { key: 'g d', label: 'G D', description: 'Go to Dashboard', category: 'navigation', handler: () => router.push('/') },
    { key: 'g p', label: 'G P', description: 'Go to Projects', category: 'navigation', handler: () => router.push('/projects') },
    { key: 'g t', label: 'G T', description: 'Go to Tasks', category: 'navigation', handler: () => router.push('/tasks') },
    { key: 'g s', label: 'G S', description: 'Go to Sprints', category: 'navigation', handler: () => router.push('/sprints') },
    { key: 'g c', label: 'G C', description: 'Go to Calendar', category: 'navigation', handler: () => router.push('/calendar') },
    { key: 'g a', label: 'G A', description: 'Go to Activity', category: 'navigation', handler: () => router.push('/activity') },
    { key: 'g ,', label: 'G ,', description: 'Go to Settings', category: 'navigation', handler: () => router.push('/settings') },
    // Actions (⌘K and [ already handled by their own providers)
    { key: 'c', label: 'C', description: 'Create new task (quick)', category: 'action', handler: () => router.push('/tasks?create=true') },
  ];

  // Track key sequence for multi-key shortcuts (e.g., "g d")
  let keySequence = '';
  let sequenceTimer: NodeJS.Timeout | null = null;

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
    if (sequenceTimer) clearTimeout(sequenceTimer);

    // Build sequence
    keySequence += keySequence ? ` ${key}` : key;

    // Check for matching shortcut
    const matched = shortcuts.find((s) => s.key === keySequence);
    if (matched) {
      e.preventDefault();
      matched.handler();
      keySequence = '';
      return;
    }

    // Check if any shortcut starts with current sequence (keep waiting)
    const hasPrefix = shortcuts.some((s) => s.key.startsWith(keySequence));
    if (!hasPrefix) {
      keySequence = '';
      return;
    }

    // Set timeout to reset sequence after 1 second
    sequenceTimer = setTimeout(() => {
      keySequence = '';
    }, 1000);
  }, [router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}
