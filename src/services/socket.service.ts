import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketReservedEvents
} from '../types/socket';

// Combina los eventos reservados con los personalizados
type AllClientEvents = ServerToClientEvents & SocketReservedEvents;
type AllServerEvents = ClientToServerEvents;

export type AppSocket = Socket<AllClientEvents, AllServerEvents>;

class SocketService {
  private socket: AppSocket | null = null;
  private isConnected = false;

  initialize(url: string, options: any = {}) {
    const defaultOptions = {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      ...options
    };

    this.socket = io(url, defaultOptions) as AppSocket;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Eventos reservados de Socket.io (con tipos correctos)
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Socket.io EVENTO CONNECT recibido');
      console.log('✅ Socket ID:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason: string) => {
      this.isConnected = false;
      console.log('❌ Desconectado del servidor:', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('💥 Error de conexión:', error);
    });

    // Eventos personalizados
    this.socket.on('connected', (data: { socketId: string; message: string }) => {
      console.log('✅ Conectado al servidor:', data);
    });

    this.socket.on('error', (data: { message: string; code: string }) => {
      console.error('💥 Error del servidor:', data);
    });

    // Logger para todos los eventos
    this.socket.onAny((event, ...args) => {
      console.log('📡 Evento recibido:', event, args);
    });
  }

  connect() {
    if (this.socket && !this.isConnected) {
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Método emit con tipos mejorados
  emit<T extends keyof AllServerEvents>(
    event: T,
    ...args: Parameters<AllServerEvents[T]>
  ) {
    if (this.socket && this.isConnected) {
      (this.socket.emit as any)(event, ...args);
    } else {
      console.warn('⚠️ Socket no conectado');
    }
  }

  // Método on con tipos mejorados
  on<T extends keyof AllClientEvents>(
    event: T,
    callback: AllClientEvents[T]
  ) {
    if (this.socket) {
      (this.socket.on as any)(event, callback);
    }
  }

  // Método off con tipos mejorados
  off<T extends keyof AllClientEvents>(
    event: T,
    callback?: AllClientEvents[T]
  ) {
    if (this.socket) {
      (this.socket.off as any)(event, callback);
    }
  }

  get connected(): boolean {
    return this.isConnected;
  }

  get id(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
export default socketService;