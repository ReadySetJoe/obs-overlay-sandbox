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
    { id: 'weather', name: 'Weather', visible: true },
    { id: 'chat', name: 'Chat', visible: true },
    { id: 'nowplaying', name: 'Now Playing', visible: true },
    { id: 'countdown', name: 'Countdown', visible: true },
    { id: 'chathighlight', name: 'Chat Highlight', visible: true },
    { id: 'paintbynumbers', name: 'Paint by Numbers', visible: true },
    { id: 'eventlabels', name: 'Recent Events', visible: true },
    { id: 'streamstats', name: 'Stream Stats', visible: true },
    { id: 'wheel', name: 'Wheel Spinner', visible: true },
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
