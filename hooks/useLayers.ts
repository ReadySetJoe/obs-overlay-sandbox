// hooks/useLayers.ts
import { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

interface UseLayersProps {
  socket: Socket | null;
}

export function useLayers({ socket }: UseLayersProps) {
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'weather', name: 'Weather', visible: false },
    { id: 'chat', name: 'Chat', visible: false },
    { id: 'nowplaying', name: 'Now Playing', visible: false },
    { id: 'countdown', name: 'Countdown', visible: false },
    { id: 'chathighlight', name: 'Chat Highlight', visible: false },
    { id: 'paintbynumbers', name: 'Paint by Numbers', visible: false },
    { id: 'eventlabels', name: 'Recent Events', visible: false },
    { id: 'streamstats', name: 'Stream Stats', visible: false },
    { id: 'wheel', name: 'Wheel Spinner', visible: false },
  ]);

  const toggleLayer = useCallback(
    (layerId: string) => {
      if (!socket) return;

      const layer = layers.find(l => l.id === layerId);
      if (!layer) return;

      const newVisible = !layer.visible;
      setLayers(prev =>
        prev.map(l => (l.id === layerId ? { ...l, visible: newVisible } : l))
      );

      socket.emit('scene-toggle', { layerId, visible: newVisible });
    },
    [socket, layers]
  );

  return {
    layers,
    setLayers,
    toggleLayer,
  };
}
