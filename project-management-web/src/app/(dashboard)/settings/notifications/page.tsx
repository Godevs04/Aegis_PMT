'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/services/api-client';

interface ChannelPrefs {
  inApp: boolean;
  email: boolean;
}

interface Preferences {
  emailEnabled: boolean;
  muteAll: boolean;
  preferences: Record<string, ChannelPrefs>;
}

const NOTIFICATION_TYPES: { key: string; label: string; description: string }[] = [
  { key: 'task.assigned', label: 'Task Assigned', description: 'When a task is assigned to you' },
  { key: 'task.completed', label: 'Task Completed', description: 'When a task you watch is completed' },
  { key: 'task.due_tomorrow', label: 'Due Tomorrow', description: 'Reminder for tasks due the next day' },
  { key: 'task.overdue', label: 'Task Overdue', description: 'When a task passes its due date' },
  { key: 'task.status_changed', label: 'Status Changed', description: 'When task status changes' },
  { key: 'comment.added', label: 'New Comment', description: 'When someone comments on your task' },
  { key: 'comment.mentioned', label: 'Mentioned', description: 'When someone @mentions you' },
  { key: 'member.invited', label: 'Invitation', description: 'When you receive an invitation' },
  { key: 'member.joined', label: 'Member Joined', description: 'When someone joins your workspace' },
  { key: 'project.updated', label: 'Project Updated', description: 'When a project you belong to is updated' },
  { key: 'sprint.started', label: 'Sprint Started', description: 'When a sprint begins' },
  { key: 'sprint.completed', label: 'Sprint Completed', description: 'When a sprint ends' },
  { key: 'milestone.completed', label: 'Milestone Completed', description: 'When a milestone is achieved' },
];

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        const response = await apiClient.get('/notifications/preferences');
        const data = response.data.data;
        // Convert Map-like object to plain object
        const prefsMap: Record<string, ChannelPrefs> = {};
        if (data.preferences) {
          for (const [key, val] of Object.entries(data.preferences)) {
            prefsMap[key] = val as ChannelPrefs;
          }
        }
        setPrefs({ emailEnabled: data.emailEnabled, muteAll: data.muteAll, preferences: prefsMap });
      } catch {
        // Default preferences
        const defaults: Record<string, ChannelPrefs> = {};
        NOTIFICATION_TYPES.forEach((t) => { defaults[t.key] = { inApp: true, email: false }; });
        setPrefs({ emailEnabled: true, muteAll: false, preferences: defaults });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const toggleChannel = (typeKey: string, channel: 'inApp' | 'email') => {
    if (!prefs) return;
    const current = prefs.preferences[typeKey] || { inApp: true, email: false };
    setPrefs({
      ...prefs,
      preferences: {
        ...prefs.preferences,
        [typeKey]: { ...current, [channel]: !current[channel] },
      },
    });
  };

  const handleSave = async () => {
    if (!prefs) return;
    setIsSaving(true);
    setSuccess(null);
    try {
      await apiClient.put('/notifications/preferences', {
        emailEnabled: prefs.emailEnabled,
        muteAll: prefs.muteAll,
        preferences: prefs.preferences,
      });
      setSuccess('Notification preferences saved.');
    } catch {
      // Silent fail
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground mt-1">Choose which notifications you receive and how.</p>
      </div>

      {success && (
        <div className="p-3 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">{success}</div>
      )}

      {/* Global Toggles */}
      <div className="p-5 rounded-xl border border-border bg-card/50 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Global Settings</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Email Notifications</p>
            <p className="text-[10px] text-muted-foreground">Receive notifications via email</p>
          </div>
          <ToggleSwitch checked={prefs?.emailEnabled ?? true} onChange={() => setPrefs(prefs ? { ...prefs, emailEnabled: !prefs.emailEnabled } : null)} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Mute All</p>
            <p className="text-[10px] text-muted-foreground">Temporarily disable all notifications</p>
          </div>
          <ToggleSwitch checked={prefs?.muteAll ?? false} onChange={() => setPrefs(prefs ? { ...prefs, muteAll: !prefs.muteAll } : null)} />
        </div>
      </div>

      {/* Per-type Preferences */}
      <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Event Preferences</h2>
          <div className="flex items-center gap-6 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            <span className="w-12 text-center">In-App</span>
            <span className="w-12 text-center">Email</span>
          </div>
        </div>
        <div className="divide-y divide-border/50">
          {NOTIFICATION_TYPES.map((type) => {
            const channels = prefs?.preferences[type.key] || { inApp: true, email: false };
            return (
              <div key={type.key} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm text-foreground">{type.label}</p>
                  <p className="text-[10px] text-muted-foreground">{type.description}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-12 flex justify-center">
                    <ToggleSwitch checked={channels.inApp} onChange={() => toggleChannel(type.key, 'inApp')} />
                  </div>
                  <div className="w-12 flex justify-center">
                    <ToggleSwitch checked={channels.email} onChange={() => toggleChannel(type.key, 'email')} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

// ─── Toggle Switch ───────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-secondary'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4.5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
