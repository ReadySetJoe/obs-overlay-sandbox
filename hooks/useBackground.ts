// hooks/useBackground.ts
import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseBackgroundProps {
  socket: Socket | null;
}

export function useBackground({ socket }: UseBackgroundProps) {
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null
  );
  const [backgroundImageName, setBackgroundImageName] = useState<string | null>(
    null
  );
  const [backgroundColors, setBackgroundColors] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1.0);
  const [backgroundBlur, setBackgroundBlur] = useState(0);

  const handleBackgroundChange = useCallback(
    (data: {
      backgroundImageUrl: string | null;
      backgroundOpacity: number;
      backgroundBlur: number;
    }) => {
      if (!socket) return;
      setBackgroundOpacity(data.backgroundOpacity);
      setBackgroundBlur(data.backgroundBlur);
      socket.emit('background-change', data);
    },
    [socket]
  );

  // Listen for background changes from upload/delete API
  useEffect(() => {
    if (!socket) return;

    const handleBackgroundUpdate = (data: {
      backgroundImageUrl: string | null;
      backgroundImageName: string | null;
      backgroundColors: string | null;
      backgroundOpacity: number;
      backgroundBlur: number;
    }) => {
      setBackgroundImageUrl(data.backgroundImageUrl);
      setBackgroundImageName(data.backgroundImageName);
      setBackgroundColors(data.backgroundColors);
      setBackgroundOpacity(data.backgroundOpacity);
      setBackgroundBlur(data.backgroundBlur);
    };

    socket.on('background-change', handleBackgroundUpdate);

    return () => {
      socket.off('background-change', handleBackgroundUpdate);
    };
  }, [socket]);

  return {
    backgroundImageUrl,
    backgroundImageName,
    backgroundColors,
    backgroundOpacity,
    backgroundBlur,
    setBackgroundImageUrl,
    setBackgroundImageName,
    setBackgroundColors,
    setBackgroundOpacity,
    setBackgroundBlur,
    handleBackgroundChange,
  };
}
