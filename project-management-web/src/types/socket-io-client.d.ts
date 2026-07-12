/**
 * Type declaration for socket.io-client
 * Run `npm install` to resolve the actual module.
 */
declare module 'socket.io-client' {
  export interface Socket {
    id: string;
    connected: boolean;
    on(event: string, callback: (...args: any[]) => void): Socket;
    off(event: string, callback?: (...args: any[]) => void): Socket;
    emit(event: string, ...args: any[]): Socket;
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
    auth?: Record<string, any> | ((cb: (data: Record<string, any>) => void) => void);
  }

  export function io(uri: string, opts?: Partial<ManagerOptions & SocketOptions>): Socket;
}
