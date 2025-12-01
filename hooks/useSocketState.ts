// hooks/useSocketState.ts
import { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseSocketStateOptions<T> {
  /**
   * Optional transformation function to modify the value before emitting
   */
  transform?: (value: T) => unknown;
  /**
   * Optional callback to execute after emitting (e.g., API calls)
   */
  onEmit?: (value: T) => void | Promise<void>;
}

/**
 * Generic hook for managing state that needs to be synced via socket emission.
 * Handles the common pattern of: setState -> emit to socket -> optional side effects
 *
 * @param socket - Socket.io client instance
 * @param eventName - The socket event name to emit
 * @param initialValue - Initial state value
 * @param options - Optional transform and onEmit callbacks
 * @returns Object with value, setValue, and emitValue
 *
 * @example
 * const { value: weather, setValue: setWeather, emitValue: changeWeather } =
 *   useSocketState(socket, 'weather-change', 'none');
 */
export function useSocketState<T>(
  socket: Socket | null,
  eventName: string,
  initialValue: T,
  options?: UseSocketStateOptions<T>
) {
  const [value, setValue] = useState<T>(initialValue);

  const emitValue = useCallback(
    async (newValue: T) => {
      if (!socket) return;

      setValue(newValue);

      // Transform the value if a transform function is provided
      const dataToEmit = options?.transform
        ? options.transform(newValue)
        : newValue;

      socket.emit(eventName, dataToEmit);

      // Execute side effects if onEmit callback is provided
      if (options?.onEmit) {
        await options.onEmit(newValue);
      }
    },
    [socket, eventName, options]
  );

  return { value, setValue, emitValue };
}
