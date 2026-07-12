'use client';

import React, { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useWorkspaceStore } from '@/store/workspace-store';
import { getSocket, disconnectSocket } from '@/services/socket-client';
import { Socket } from 'socket.io-client';
import { TASKS_QUERY_KEY } from '@/hooks/use-tasks';
import { DASHBOARD_QUERY_KEY } from '@/hooks/use-dashboard';

/**
 * SocketProvider
 *
 * Manages the WebSocket lifecycle and listens for real-time events.
 * Invalidates relevant TanStack Query caches when events are received.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { currentWorkspaceId } = useWorkspaceStore();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      disconnectSocket();
      socketRef.current = null;
      return;
    }

    // Connect
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    // Join workspace room
    if (currentWorkspaceId) {
      socket.emit('workspace:join', currentWorkspaceId);
    }

    // ─── Event Handlers ────────────────────────────────────────────────────

    // New notification → invalidate notifications query
    socket.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // New activity → invalidate activity and dashboard queries
    socket.on('activity:new', () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: [DASHBOARD_QUERY_KEY] });
    });

    // Task updated → invalidate tasks query
    socket.on('task:updated', () => {
      queryClient.invalidateQueries({ queryKey: [TASKS_QUERY_KEY] });
    });

    // Cleanup
    return () => {
      socket.off('notification:new');
      socket.off('activity:new');
      socket.off('task:updated');

      if (currentWorkspaceId) {
        socket.emit('workspace:leave', currentWorkspaceId);
      }
    };
  }, [isAuthenticated, accessToken, currentWorkspaceId, queryClient]);

  // Disconnect on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  return <>{children}</>;
}

export default SocketProvider;
