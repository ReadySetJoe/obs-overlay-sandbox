// hooks/useSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (sessionId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Don't connect if no sessionId provided
    if (!sessionId) return;

    const socketInstance = io({
      path: '/api/socket',
    });

    socketInstance.on('connect', () => {
      // Join the session room
      socketInstance.emit('join-session', sessionId);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [sessionId]);

  return { socket, isConnected };
};
