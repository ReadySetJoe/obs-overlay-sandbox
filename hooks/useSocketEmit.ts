// hooks/useSocketEmit.ts
import { useCallback } from 'react';
import { Socket } from 'socket.io-client';

/**
 * Hook that returns a socket emit function with built-in null checking.
 * Useful for cases where you need to emit events without managing state.
 *
 * @param socket - Socket.io client instance
 * @param eventName - The socket event name to emit
 * @returns Emit function that checks for socket availability
 *
 * @example
 * const emitWeatherChange = useSocketEmit(socket, 'weather-change');
 * emitWeatherChange({ type: 'rain', intensity: 0.5 });
 */
export function useSocketEmit<T = unknown>(
  socket: Socket | null,
  eventName: string
) {
  const emit = useCallback(
    (data: T) => {
      if (!socket) return;
      socket.emit(eventName, data);
    },
    [socket, eventName]
  );

  return emit;
}
