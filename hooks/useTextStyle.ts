import { useCallback } from 'react';
import { useSocketState } from './useSocketState';
import { Socket } from 'socket.io-client';

export function useTextStyle({ socket }: { socket: Socket | null }) {
  const {
    value: fontFamily,
    setValue: setFontFamily,
    emitValue: emitFontFamily,
  } = useSocketState<string>(socket, 'font-family-change', 'Arial');

  const handleFontFamilyChange = useCallback(
    (font: string) => {
      emitFontFamily(font);
    },
    [emitFontFamily]
  );

  return {
    fontFamily,
    setFontFamily,
    handleFontFamilyChange,
  };
}
