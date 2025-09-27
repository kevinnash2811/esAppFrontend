import { ref, onUnmounted, computed } from 'vue';
import { socketService } from '../services/socket.service';
import type { Message, User } from '../types/socket';

export function useSocket() {
  const isConnected = ref(false);
  const socketId = ref<string>('');
  const connectionError = ref<string>('');

  const setupConnectionListeners = () => {
    console.log('🔧 Configurando listeners de socket...');
    
    // Usar los listeners del socketService que ya están configurados en initialize()
    // Solo necesitamos actualizar nuestras variables reactivas
    
    socketService.on('connect', () => {
      console.log('🔗 Socket físico conectado - useSocket');
      isConnected.value = true;
      connectionError.value = '';
    });

    socketService.on('connected', (data: any) => {
      console.log('✅ Evento "connected" recibido de NestJS - useSocket:', data);
      isConnected.value = true;
      socketId.value = data.socketId;
      connectionError.value = '';
    });

    socketService.on('disconnect', (reason: string) => {
      console.log('❌ Socket desconectado - useSocket:', reason);
      isConnected.value = false;
      socketId.value = '';
    });

    socketService.on('connect_error', (error: Error) => {
      console.error('💥 Error de conexión - useSocket:', error);
      connectionError.value = `Error de conexión: ${error.message}`;
    });

    socketService.on('error', (data: any) => {
      console.error('💥 Error del servidor - useSocket:', data);
      connectionError.value = `Error del servidor: ${data.message}`;
    });
  };

  const connect = (url: string, options?: any) => {
    console.log('🔄 Intentando conectar a:', url);
    connectionError.value = '';
    
    // PRIMERO inicializar el socket (esto ya configura sus listeners internos)
    socketService.initialize(url, options);
    
    // LUEGO configurar nuestros listeners reactivos
    setupConnectionListeners();
    
    // FINALMENTE conectar
    socketService.connect();
  };

  const disconnect = () => {
    console.log('🔌 Desconectando socket');
    socketService.disconnect();
    connectionError.value = '';
  };

  // Métodos específicos para emitir eventos
  const emit = {
    joinRoom: (roomId: string, username: string) => {
      socketService.emit('join:room', { roomId, username });
    },
    leaveRoom: (roomId: string) => {
      socketService.emit('leave:room', { roomId });
    },
    sendMessage: (roomId: string, text: string) => {
      socketService.emit('send:message', { roomId, text });
    },
    startTyping: (roomId: string) => {
      socketService.emit('typing:start', { roomId });
    },
    stopTyping: (roomId: string) => {
      socketService.emit('typing:stop', { roomId });
    }
  };

  const on = {
    roomJoined: (callback: (data: any) => void) => {
      socketService.on('room:joined', callback);
    },
    userJoined: (callback: (data: { user: User; roomId: string }) => void) => {
      socketService.on('user:joined', callback);
    },
    userLeft: (callback: (data: { user: User; roomId: string }) => void) => {
      socketService.on('user:left', callback);
    },
    roomMessage: (callback: (data: Message) => void) => {
      socketService.on('room:message', callback);
    },
    userTypingStart: (callback: (data: { user: User; roomId: string }) => void) => {
      socketService.on('user:typing:start', callback);
    },
    userTypingStop: (callback: (data: { user: User; roomId: string }) => void) => {
      socketService.on('user:typing:stop', callback);
    },
    connected: (callback: (data: any) => void) => {
      socketService.on('connected', callback);
    },
    error: (callback: (data: any) => void) => {
      socketService.on('error', callback);
    }
  };

  const off = {
    userJoined: (callback?: (data: { user: User; roomId: string }) => void) => {
      socketService.off('user:joined', callback);
    },
    userLeft: (callback?: (data: { user: User; roomId: string }) => void) => {
      socketService.off('user:left', callback);
    },
    roomMessage: (callback?: (data: Message) => void) => {
      socketService.off('room:message', callback);
    },
    userTypingStart: (callback?: (data: { user: User; roomId: string }) => void) => {
      socketService.off('user:typing:start', callback);
    },
    userTypingStop: (callback?: (data: { user: User; roomId: string }) => void) => {
      socketService.off('user:typing:stop', callback);
    }
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected: computed(() => isConnected.value),
    socketId: computed(() => socketId.value),
    error: computed(() => connectionError.value),
    connect,
    disconnect,
    emit,
    on,
    off
  };
}