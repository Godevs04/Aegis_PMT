'use client';

import React, { useState } from 'react';
import { Bell, Check, Inbox } from 'lucide-react';
import {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/hooks/use-activities';

export function NotificationBell() {
  const { data: notifications, isLoading } = useNotificationsQuery();
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllReadMutation = useMarkAllNotificationsReadMutation();
  const [isOpen, setIsOpen] = useState(false);

  const unreadNotifications = notifications?.filter((n) => !n.isRead) || [];
  const unreadCount = unreadNotifications.length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full border border-border bg-zinc-900/60 hover:bg-zinc-800 text-muted-foreground hover:text-white transition-colors"
        disabled={isLoading}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full flex items-center justify-center text-[9px] font-bold text-white leading-none scale-90">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-zinc-900 p-2.5 shadow-2xl z-40">
            <div className="flex items-center justify-between px-2 pb-2 border-b border-border">
              <span className="text-xs font-bold text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-[10px] text-primary hover:underline font-semibold"
                  disabled={markAllReadMutation.isPending}
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto mt-2 space-y-1">
              {!notifications || notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                  <Inbox className="h-8 w-8 opacity-20 mb-2" />
                  <span className="text-xs">No notifications yet</span>
                </div>
              ) : (
                notifications.map((notification) => {
                  let alertText = '';
                  if (notification.type === 'TASK_ASSIGNED') {
                    alertText = `assigned you a task.`;
                  } else if (notification.type === 'COMMENT_ADDED') {
                    alertText = `commented on your task.`;
                  } else {
                    alertText = `triggered an action.`;
                  }

                  return (
                    <div
                      key={notification._id}
                      onClick={() => {
                        if (!notification.isRead) {
                          markReadMutation.mutate(notification._id);
                        }
                      }}
                      className={`flex items-start justify-between p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        notification.isRead
                          ? 'hover:bg-zinc-800/40 text-zinc-400'
                          : 'bg-primary/5 hover:bg-primary/10 text-white font-medium'
                      }`}
                    >
                      <div className="space-y-0.5 truncate pr-2">
                        <p className="truncate">
                          <strong className="text-zinc-200">{notification.actorId?.name}</strong>{' '}
                          {alertText}
                        </p>
                        <span className="text-[9px] text-muted-foreground block">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {!notification.isRead && (
                        <button className="p-1 rounded hover:bg-zinc-800 text-primary self-center shrink-0">
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationBell;
