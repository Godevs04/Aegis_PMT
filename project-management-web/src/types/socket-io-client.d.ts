/**
 * Type declaration for socket.io-client
 * Run `npm install` to resolve the actual module.
 */
declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    on(event: string, callback: (...args: unknown[]) => void): Socket;
    off(event: string, callback?: (...args: unknown[]) => void): Socket;
    emit(event: string, ...args: unknown[]): Socket;
    connect(): Socket;
    disconnect(): Socket;
  }

  export interface ManagerOptions {
    autoConnect?: boolean;
    reconnection?: boolean;
    reconnectionAttempts?: number;
    reconnectionDelay?: number;
    timeout?: number;
    transports?: string[];
  }

  export interface SocketOptions {
    auth?:
      | Record<string, unknown>
      | ((cb: (data: Record<string, unknown>) => void) => void);
  }

  export function io(uri: string, opts?: Partial<ManagerOptions & SocketOptions>): Socket;
}
