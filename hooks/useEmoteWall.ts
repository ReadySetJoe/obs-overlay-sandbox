// hooks/useEmoteWall.ts
import { useState, useCallback } from 'react';
import { EmoteWallConfig } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketEmit } from './useSocketEmit';

interface UseEmoteWallProps {
  socket: Socket | null;
}

export function useEmoteWall({ socket }: UseEmoteWallProps) {
  const [emoteInput, setEmoteInput] = useState('🎉 🎊 ✨ 🌟 💫');
  const [emoteIntensity, setEmoteIntensity] = useState<
    'light' | 'medium' | 'heavy'
  >('medium');

  const emitEmoteWall = useSocketEmit(socket, 'emote-wall');

  const triggerEmoteWall = useCallback(() => {
    const emotes = emoteInput.split(/\s+/).filter(e => e.trim());
    const config: EmoteWallConfig = {
      emotes,
      duration: 10000,
      intensity: emoteIntensity,
    };

    emitEmoteWall(config);
  }, [emitEmoteWall, emoteInput, emoteIntensity]);

  return {
    emoteInput,
    emoteIntensity,
    setEmoteInput,
    setEmoteIntensity,
    triggerEmoteWall,
  };
}
