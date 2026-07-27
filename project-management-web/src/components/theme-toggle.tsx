'use client';

import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/utils/cn';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Cycle light → dark → system so each click is a clear visual change
  const cycle = () => {
    const current = theme ?? 'system';
    if (current === 'light') setTheme('dark');
    else if (current === 'dark') setTheme('system');
    else setTheme('light');
  };

  const active = theme === 'system' ? 'system' : (resolvedTheme ?? theme ?? 'system');
  const Icon = active === 'dark' ? Moon : active === 'light' ? Sun : Monitor;
  const label = theme === 'system' ? 'System' : active === 'dark' ? 'Dark' : 'Light';

  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        'h-8 rounded-md flex items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors',
        showLabel ? 'px-2.5' : 'w-8',
        className
      )}
      title={`Theme: ${label} (click to cycle Light → Dark → System)`}
      aria-label={`Current theme: ${label}. Click to change.`}
      suppressHydrationWarning
    >
      <Icon className="h-4 w-4" />
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

interface ThemeSelectorProps {
  value?: 'dark' | 'light' | 'system';
  onChange: (theme: 'dark' | 'light' | 'system') => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { setTheme, theme } = useTheme();
  const current = value ?? (theme as 'dark' | 'light' | 'system' | undefined) ?? 'system';

  const options: { id: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => {
        const Icon = opt.icon;
        const isActive = current === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => {
              setTheme(opt.id);
              onChange(opt.id);
            }}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-all',
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default ThemeToggle;
