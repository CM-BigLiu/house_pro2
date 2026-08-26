import { io, Socket } from 'socket.io-client';
import { useUserStore } from '@/stores/user';

let socket: Socket | null = null;

export function connectSocket() {
  const userStore = useUserStore();
  if (!userStore.token) return null;
  if (socket?.connected) return socket;

  const baseURL = (import.meta as any).env?.VITE_API_BASE_URL || '';
  socket = io(`${baseURL}/events`, {
    auth: { token: `Bearer ${userStore.token}` },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('websocket connected');
  });

  socket.on('disconnect', () => {
    console.log('websocket disconnected');
  });

  socket.on('dashboard:update', (payload) => {
    console.log('dashboard update', payload);
  });

  socket.on('status:change', (payload) => {
    console.log('status change', payload);
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
