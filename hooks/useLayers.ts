// hooks/useLayers.ts
import { useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { useSocketEmit } from './useSocketEmit';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

interface UseLayersProps {
  socket: Socket | null;
}

const DEFAULT_LAYERS: Layer[] = [
  { id: 'weather', name: 'Weather', visible: false },
  { id: 'chat', name: 'Chat', visible: false },
  { id: 'nowplaying', name: 'Now Playing', visible: false },
  { id: 'countdown', name: 'Countdown', visible: false },
  { id: 'chathighlight', name: 'Chat Highlight', visible: false },
  { id: 'paintbynumbers', name: 'Paint by Numbers', visible: false },
  { id: 'eventlabels', name: 'Recent Events', visible: false },
  { id: 'streamstats', name: 'Stream Stats', visible: false },
  { id: 'wheel', name: 'Wheel Spinner', visible: false },
  { id: 'alerts', name: 'Alerts', visible: false },
  { id: 'tts', name: 'Text to Speech', visible: false },
];

export function useLayers({ socket }: UseLayersProps) {
  const [layers, setLayers] = useState<Layer[]>(DEFAULT_LAYERS);
  const emitSceneToggle = useSocketEmit(socket, 'scene-toggle');

  const toggleLayer = useCallback(
    (layerId: string) => {
      const layer = layers.find(l => l.id === layerId);
      if (!layer) return;

      const newVisible = !layer.visible;
      setLayers(prev =>
        prev.map(l => (l.id === layerId ? { ...l, visible: newVisible } : l))
      );

      emitSceneToggle({ layerId, visible: newVisible });
    },
    [emitSceneToggle, layers]
  );

  return {
    layers,
    setLayers,
    toggleLayer,
  };
}
