'use client';

import React, { useState, useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { useKeyboardShortcuts, Shortcut } from '@/hooks/use-keyboard-shortcuts';

/**
 * KeyboardShortcutsDialog
 *
 * Press ? to open this dialog showing all available keyboard shortcuts.
 */
export function KeyboardShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const shortcuts = useKeyboardShortcuts();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const grouped = {
    navigation: shortcuts.filter((s) => s.category === 'navigation'),
    action: shortcuts.filter((s) => s.category === 'action'),
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Keyboard className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Keyboard Shortcuts</h2>
            </div>
            <kbd className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border">
              ? to toggle
            </kbd>
          </div>

          {/* Shortcuts List */}
          <div className="p-5 space-y-5 max-h-[400px] overflow-y-auto">
            {/* Global */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Global</p>
              <div className="space-y-1.5">
                <ShortcutRow keys="⌘ K" description="Open command palette" />
                <ShortcutRow keys="[" description="Toggle sidebar" />
                <ShortcutRow keys="?" description="Show keyboard shortcuts" />
              </div>
            </div>

            {/* Navigation */}
            {grouped.navigation.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Navigation</p>
                <div className="space-y-1.5">
                  {grouped.navigation.map((s) => (
                    <ShortcutRow key={s.key} keys={s.label} description={s.description} />
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {grouped.action.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Actions</p>
                <div className="space-y-1.5">
                  {grouped.action.map((s) => (
                    <ShortcutRow key={s.key} keys={s.label} description={s.description} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ShortcutRow({ keys, description }: { keys: string; description: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-foreground">{description}</span>
      <div className="flex items-center gap-1">
        {keys.split(' ').map((k, i) => (
          <kbd
            key={i}
            className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export default KeyboardShortcutsDialog;
