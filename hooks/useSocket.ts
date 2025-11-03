// hooks/useSocket.ts
import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

/**
 * Enhanced Socket.io hook with OBS browser source compatibility
 * Features:
 * - Server initialization before connection
 * - Explicit connection URL for OBS compatibility
 * - Automatic retry with exponential backoff
 * - Comprehensive error handling and logging
 * - Connection health monitoring
 */
export const useSocket = (sessionId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;

  useEffect(() => {
    // Don't connect if no sessionId provided
    if (!sessionId) {
      console.log('[useSocket] No sessionId provided, skipping connection');
      return;
    }

    let socketInstance: Socket | null = null;
    let isCleaningUp = false;

    const initializeSocket = async () => {
      console.log('[useSocket] Initializing socket for session:', sessionId);
      console.log('[useSocket] Current URL:', window.location.href);

      // Step 1: Initialize the socket server by hitting the API endpoint
      // This ensures the server is running before we try to connect
      try {
        console.log('[useSocket] Initializing socket server...');
        const response = await fetch('/api/socket');
        console.log('[useSocket] Socket server initialized:', response.ok);
      } catch (error) {
        console.warn('[useSocket] Failed to initialize socket server (will retry connection):', error);
      }

      // Step 2: Wait a bit for server to be fully ready (especially important in OBS)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Create socket connection with explicit URL and OBS-compatible settings
      const socketUrl = window.location.origin;
      console.log('[useSocket] Connecting to socket at:', socketUrl);

      socketInstance = io(socketUrl, {
        path: '/api/socket',
        transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
        reconnection: true,
        reconnectionAttempts: maxRetries,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000, // 20 second timeout for OBS
        forceNew: false,
        autoConnect: true,
      });

      // Connection success handler
      socketInstance.on('connect', () => {
        console.log('[useSocket] ✅ Socket connected successfully!');
        console.log('[useSocket] Socket ID:', socketInstance?.id);
        console.log('[useSocket] Transport:', socketInstance?.io.engine.transport.name);

        // Join the session room
        socketInstance?.emit('join-session', sessionId);
        console.log('[useSocket] Joined session room:', sessionId);

        setIsConnected(true);
        retryCountRef.current = 0; // Reset retry counter on success
      });

      // Disconnection handler
      socketInstance.on('disconnect', (reason) => {
        console.log('[useSocket] ⚠️ Socket disconnected. Reason:', reason);
        setIsConnected(false);
      });

      // Reconnection attempt handler
      socketInstance.on('reconnect_attempt', (attemptNumber) => {
        console.log(`[useSocket] 🔄 Reconnection attempt #${attemptNumber}...`);
      });

      // Reconnection success handler
      socketInstance.on('reconnect', (attemptNumber) => {
        console.log(`[useSocket] ✅ Reconnected after ${attemptNumber} attempts`);
        // Re-join the session room after reconnection
        socketInstance?.emit('join-session', sessionId);
        console.log('[useSocket] Re-joined session room:', sessionId);
      });

      // Reconnection error handler
      socketInstance.on('reconnect_error', (error) => {
        console.error('[useSocket] ❌ Reconnection error:', error);
      });

      // Reconnection failed handler
      socketInstance.on('reconnect_failed', () => {
        console.error('[useSocket] ❌ Reconnection failed after maximum attempts');
      });

      // Connection error handler
      socketInstance.on('connect_error', (error) => {
        console.error('[useSocket] ❌ Connection error:', error.message);
        console.error('[useSocket] Error details:', error);

        // Provide helpful debugging info
        if (error.message.includes('xhr poll error')) {
          console.error('[useSocket] This may indicate CORS or network issues');
        } else if (error.message.includes('websocket error')) {
          console.error('[useSocket] WebSocket connection failed, will try polling');
        }
      });

      // Generic error handler
      socketInstance.on('error', (error) => {
        console.error('[useSocket] ❌ Socket error:', error);
      });

      setSocket(socketInstance);
    };

    // Start initialization
    initializeSocket();

    // Cleanup function
    return () => {
      isCleaningUp = true;
      console.log('[useSocket] Cleaning up socket connection');
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [sessionId]);

  return { socket, isConnected };
};
