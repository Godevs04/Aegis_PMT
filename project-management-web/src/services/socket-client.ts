import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket: Socket | null = null;

/**
 * Get or create a Socket.IO connection.
 * Authenticates using the access token from the auth store.
 */
export function getSocket(): Socket | null {
  if (socket?.connected) return socket;

  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  return socket;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance (may be null).
 */
export function getCurrentSocket(): Socket | null {
  return socket;
}

export default { getSocket, disconnectSocket, getCurrentSocket };
