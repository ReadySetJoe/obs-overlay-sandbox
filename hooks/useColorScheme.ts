// hooks/useColorScheme.ts
import { useState, useCallback } from 'react';
import { ColorScheme, CustomColors } from '@/types/overlay';
import { Socket } from 'socket.io-client';

interface UseColorSchemeProps {
  socket: Socket | null;
  isConnected: boolean;
}

export function useColorScheme({ socket, isConnected }: UseColorSchemeProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);
  const [fontFamily, setFontFamily] = useState<string>('Inter');

  const changeColorScheme = useCallback(
    (scheme: ColorScheme) => {
      if (!socket) return;
      setColorScheme(scheme);
      socket.emit('color-scheme-change', scheme);

      // Emit custom colors if using custom scheme
      if (scheme === 'custom' && customColors) {
        socket.emit('custom-colors-change', customColors);
      }
    },
    [socket, customColors]
  );

  const handleCustomColorsChange = useCallback(
    (colors: CustomColors) => {
      if (!socket) return;
      setCustomColors(colors);
      socket.emit('custom-colors-change', colors);

      // If not already on custom scheme, switch to it
      if (colorScheme !== 'custom') {
        setColorScheme('custom');
        socket.emit('color-scheme-change', 'custom');
      }
    },
    [socket, colorScheme]
  );

  const handleFontFamilyChange = useCallback(
    (font: string) => {
      if (!socket) return;
      setFontFamily(font);
      socket.emit('font-family-change', font);
    },
    [socket]
  );

  return {
    colorScheme,
    customColors,
    fontFamily,
    setColorScheme,
    setCustomColors,
    setFontFamily,
    changeColorScheme,
    handleCustomColorsChange,
    handleFontFamilyChange,
  };
}
