// hooks/useOverlaySocket.ts
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  ChatMessage as ChatMessageType,
  ColorScheme,
  WeatherEffect as WeatherEffectType,
  NowPlaying as NowPlayingType,
  SceneLayer,
  CountdownTimer as CountdownTimerType,
  EmoteWallConfig,
  ComponentLayouts,
  ChatHighlight as ChatHighlightType,
  PaintByNumbersState,
} from '@/types/overlay';

export function useOverlaySocket(sessionId: string) {
  const { socket, isConnected } = useSocket(sessionId);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffectType>('rain');
  const [nowPlaying, setNowPlaying] = useState<NowPlayingType | null>(null);
  const [countdownTimers, setCountdownTimers] = useState<CountdownTimerType[]>(
    []
  );
  const [componentLayouts, setComponentLayouts] = useState<ComponentLayouts>({
    chat: { position: 'top-right', x: 0, y: 80, maxWidth: 400 },
    nowPlaying: { position: 'bottom-right', x: 0, y: 0, width: 400, scale: 1 },
    countdown: { position: 'bottom-left', x: 0, y: 0, scale: 1, minWidth: 320 },
    weather: { density: 1 },
    chatHighlight: {
      position: 'bottom-left',
      x: 20,
      y: 20,
      width: 500,
      scale: 1,
    },
    paintByNumbers: {
      position: 'top-left',
      x: 0,
      y: 0,
      scale: 1,
      gridSize: 20,
    },
  });
  const [sceneLayers, setSceneLayers] = useState<SceneLayer[]>([
    { id: 'weather', name: 'Weather', visible: true, zIndex: 2 },
    { id: 'chat', name: 'Chat', visible: true, zIndex: 5 },
    { id: 'nowplaying', name: 'Now Playing', visible: true, zIndex: 10 },
    { id: 'countdown', name: 'Countdown', visible: true, zIndex: 15 },
    { id: 'chathighlight', name: 'Chat Highlight', visible: true, zIndex: 20 },
    {
      id: 'paintbynumbers',
      name: 'Paint by Numbers',
      visible: true,
      zIndex: 12,
    },
  ]);
  const [chatHighlight, setChatHighlight] = useState<ChatHighlightType | null>(
    null
  );
  const [paintByNumbersState, setPaintByNumbersState] =
    useState<PaintByNumbersState | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (message: ChatMessageType) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('color-scheme-change', (scheme: ColorScheme) => {
      setColorScheme(scheme);
    });

    socket.on('weather-change', (effect: WeatherEffectType) => {
      setWeatherEffect(effect);
    });

    socket.on('now-playing', (track: NowPlayingType) => {
      setNowPlaying(track);
    });

    socket.on('scene-toggle', (data: { layerId: string; visible: boolean }) => {
      setSceneLayers(prev =>
        prev.map(layer =>
          layer.id === data.layerId
            ? { ...layer, visible: data.visible }
            : layer
        )
      );
    });

    socket.on('countdown-timers', (timers: CountdownTimerType[]) => {
      setCountdownTimers(timers);
    });

    socket.on('emote-wall', (config: EmoteWallConfig) => {
      // Trigger emote wall via global function
      if ((window as any).triggerEmoteWall) {
        (window as any).triggerEmoteWall(config);
      }
    });

    socket.on('component-layouts', (layouts: ComponentLayouts) => {
      setComponentLayouts(layouts);
    });

    socket.on('chat-highlight', (highlight: ChatHighlightType | null) => {
      setChatHighlight(highlight);
    });

    socket.on('paint-state', (state: PaintByNumbersState | null) => {
      setPaintByNumbersState(state);
    });

    return () => {
      socket.off('chat-message');
      socket.off('color-scheme-change');
      socket.off('weather-change');
      socket.off('now-playing');
      socket.off('scene-toggle');
      socket.off('countdown-timers');
      socket.off('emote-wall');
      socket.off('component-layouts');
      socket.off('chat-highlight');
      socket.off('paint-state');
    };
  }, [socket]);

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const getLayerVisible = (layerId: string) => {
    return sceneLayers.find(l => l.id === layerId)?.visible ?? true;
  };

  const colorSchemeStyles: Record<ColorScheme, string> = {
    default: 'from-blue-900/20 to-purple-900/20',
    gaming: 'from-red-900/20 to-orange-900/20',
    chill: 'from-cyan-900/20 to-purple-900/20',
    energetic: 'from-orange-900/20 to-pink-900/20',
    dark: 'from-gray-900/20 to-black/20',
    neon: 'from-cyan-500/20 to-fuchsia-500/20',
    custom: 'from-blue-900/20 to-purple-900/20',
  };

  return {
    socket,
    isConnected,
    messages,
    colorScheme,
    weatherEffect,
    nowPlaying,
    countdownTimers,
    componentLayouts,
    sceneLayers,
    chatHighlight,
    paintByNumbersState,
    removeMessage,
    getLayerVisible,
    colorSchemeStyles,
  };
}
