// hooks/useColorScheme.ts
import { useCallback } from 'react';
import { ColorScheme, CustomColors } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketState } from './useSocketState';

interface UseColorSchemeProps {
  socket: Socket | null;
}

export function useColorScheme({ socket }: UseColorSchemeProps) {
  const {
    value: colorScheme,
    setValue: setColorScheme,
    emitValue: emitColorScheme,
  } = useSocketState<ColorScheme>(socket, 'color-scheme-change', 'default');

  const {
    value: customColors,
    setValue: setCustomColors,
    emitValue: emitCustomColors,
  } = useSocketState<CustomColors | null>(socket, 'custom-colors-change', null);

  const changeColorScheme = useCallback(
    (scheme: ColorScheme) => {
      emitColorScheme(scheme);

      // Emit custom colors if using custom scheme
      if (scheme === 'custom' && customColors) {
        emitCustomColors(customColors);
      }
    },
    [emitColorScheme, emitCustomColors, customColors]
  );

  const handleCustomColorsChange = useCallback(
    (colors: CustomColors) => {
      emitCustomColors(colors);

      // If not already on custom scheme, switch to it
      if (colorScheme !== 'custom') {
        emitColorScheme('custom');
      }
    },
    [emitCustomColors, emitColorScheme, colorScheme]
  );

  return {
    colorScheme,
    customColors,
    setColorScheme,
    setCustomColors,
    changeColorScheme,
    handleCustomColorsChange,
  };
}
