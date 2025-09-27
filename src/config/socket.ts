export const socketConfig = {
  development: {
    url: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
    options: {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5
    }
  },
  production: {
    url: import.meta.env.VITE_SOCKET_URL || 'https://tu-api.com',
    options: {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10
    }
  }
};

export const getSocketConfig = () => {
  const env = import.meta.env.MODE || 'development';
  return socketConfig[env as keyof typeof socketConfig] || socketConfig.development;
};