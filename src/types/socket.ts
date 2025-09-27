export interface Message {
  id: string;
  text: string;
  user: string;
  timestamp: string;
  roomId?: string;
}

export interface User {
  id: string;
  username: string;
  isOnline: boolean;
}

// Eventos que EMITE el cliente al servidor
export interface ClientToServerEvents {
  'join:room': (data: { roomId: string; username: string }) => void;
  'leave:room': (data: { roomId: string }) => void;
  'send:message': (data: { roomId: string; text: string }) => void;
  'typing:start': (data: { roomId: string }) => void;
  'typing:stop': (data: { roomId: string }) => void;
}

// Eventos que ESCUCHA el cliente del servidor
export interface ServerToClientEvents {
  'connected': (data: { socketId: string; message: string }) => void;
  'room:joined': (data: { roomId: string; user: User; message: string }) => void;
  'disconnected': (data: { socketId: string; message: string }) => void;
  'user:joined': (data: { user: User; roomId: string }) => void;
  'user:left': (data: { user: User; roomId: string }) => void;
  'room:message': (data: Message) => void;
  'user:typing:start': (data: { user: User; roomId: string }) => void;
  'user:typing:stop': (data: { user: User; roomId: string }) => void;
  'error': (data: { message: string; code: string }) => void;
}

// Tipos para los eventos reservados de Socket.io
export interface SocketReservedEvents {
  connect: () => void;
  connect_error: (error: Error) => void;
  disconnect: (reason: string) => void;
}