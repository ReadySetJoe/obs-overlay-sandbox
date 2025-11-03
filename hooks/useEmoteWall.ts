// hooks/useEmoteWall.ts
import { useState, useCallback } from 'react';
import { EmoteWallConfig } from '@/types/overlay';
import { Socket } from 'socket.io-client';

interface UseEmoteWallProps {
  socket: Socket | null;
  isConnected: boolean;
}

export function useEmoteWall({ socket, isConnected }: UseEmoteWallProps) {
  const [emoteInput, setEmoteInput] = useState('🎉 🎊 ✨ 🌟 💫');
  const [emoteIntensity, setEmoteIntensity] = useState<
    'light' | 'medium' | 'heavy'
  >('medium');

  const triggerEmoteWall = useCallback(() => {
    if (!socket || !isConnected) return;

    const emotes = emoteInput.split(/\s+/).filter(e => e.trim());
    const config: EmoteWallConfig = {
      emotes,
      duration: 10000,
      intensity: emoteIntensity,
    };

    socket.emit('emote-wall', config);
  }, [socket, isConnected, emoteInput, emoteIntensity]);

  return {
    emoteInput,
    emoteIntensity,
    setEmoteInput,
    setEmoteIntensity,
    triggerEmoteWall,
  };
}
