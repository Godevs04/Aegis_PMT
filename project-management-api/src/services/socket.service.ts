import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { WorkspaceMember } from '../modules/members/workspace-member.model';
import logger from '../config/logger';

interface TokenPayload {
  userId: string;
  role?: string;
  tokenVersion: number;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

/**
 * SocketService
 *
 * Manages WebSocket connections via Socket.IO.
 * - JWT authentication on connection
 * - Room management: user:{userId}, workspace:{workspaceId}
 * - Event emission helpers for notifications and activities
 * - Future-ready: presence, typing indicators, live collaboration
 */
class SocketService {
  private io: Server | null = null;
  private onlineUsers: Map<string, Set<string>> = new Map(); // userId -> Set<socketId>

  /**
   * Initialize Socket.IO with the HTTP server.
   */
  initialize(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace('Bearer ', '');

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'dev_jwt_access_secret_key'
        ) as TokenPayload;

        socket.userId = decoded.userId;
        next();
      } catch {
        next(new Error('Invalid or expired authentication token'));
      }
    });

    // Connection handler
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      if (!userId) {
        socket.disconnect(true);
        return;
      }

      logger.info(`[Socket] User connected: ${userId} (socket: ${socket.id})`);

      // Track online status
      this.addOnlineUser(userId, socket.id);

      // Join personal user room
      socket.join(`user:${userId}`);

      // Auto-join workspace rooms based on memberships
      await this.joinWorkspaceRooms(socket, userId);

      // Handle client-initiated room joins (e.g., switching workspaces)
      socket.on('workspace:join', (workspaceId: string) => {
        socket.join(`workspace:${workspaceId}`);
      });

      socket.on('workspace:leave', (workspaceId: string) => {
        socket.leave(`workspace:${workspaceId}`);
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logger.info(`[Socket] User disconnected: ${userId} (reason: ${reason})`);
        this.removeOnlineUser(userId, socket.id);
      });
    });

    logger.info('[Socket] Socket.IO initialized');
  }

  /**
   * Emit an event to a specific user's personal room.
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit an event to all members of a workspace room.
   */
  emitToWorkspace(workspaceId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`workspace:${workspaceId}`).emit(event, data);
  }

  /**
   * Emit a notification event to a specific user.
   */
  emitNotification(userId: string, notification: any): void {
    this.emitToUser(userId, 'notification:new', notification);
  }

  /**
   * Emit an activity event to a workspace.
   */
  emitActivity(workspaceId: string, activity: any): void {
    this.emitToWorkspace(workspaceId, 'activity:new', activity);
  }

  /**
   * Emit a task update event to a workspace (for optimistic UI invalidation).
   */
  emitTaskUpdate(workspaceId: string, data: { taskId: string; action: string; userId: string }): void {
    this.emitToWorkspace(workspaceId, 'task:updated', data);
  }

  /**
   * Check if a user is currently online.
   */
  isUserOnline(userId: string): boolean {
    const sockets = this.onlineUsers.get(userId);
    return !!sockets && sockets.size > 0;
  }

  /**
   * Get list of online user IDs in a workspace.
   * (Future: presence indicators)
   */
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers.keys());
  }

  /**
   * Get the Socket.IO server instance (for advanced use cases).
   */
  getIO(): Server | null {
    return this.io;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private async joinWorkspaceRooms(socket: AuthenticatedSocket, userId: string): Promise<void> {
    try {
      const memberships = await WorkspaceMember.find({
        userId,
        status: 'active',
      }).select('workspaceId');

      for (const membership of memberships) {
        socket.join(`workspace:${membership.workspaceId.toString()}`);
      }
    } catch (err) {
      logger.error(`[Socket] Failed to join workspace rooms for user ${userId}: ${(err as Error).message}`);
    }
  }

  private addOnlineUser(userId: string, socketId: string): void {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.set(userId, new Set());
    }
    this.onlineUsers.get(userId)!.add(socketId);
  }

  private removeOnlineUser(userId: string, socketId: string): void {
    const sockets = this.onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.onlineUsers.delete(userId);
      }
    }
  }
}

// Export singleton
export const socketService = new SocketService();
export default socketService;
