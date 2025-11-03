// hooks/useOverlaySocket.ts
import { useEffect, useState, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  ChatMessage as ChatMessageType,
  ColorScheme,
  CustomColors,
  WeatherEffect as WeatherEffectType,
  NowPlaying as NowPlayingType,
  SceneLayer,
  CountdownTimer as CountdownTimerType,
  EmoteWallConfig,
  ComponentLayouts,
  ChatHighlight as ChatHighlightType,
  PaintByNumbersState,
} from '@/types/overlay';
import { colorSchemePresets } from '@/lib/colorSchemes';

export function useOverlaySocket(sessionId: string) {
  const { socket, isConnected } = useSocket(sessionId);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffectType>('none');
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
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1.0);
  const [backgroundBlur, setBackgroundBlur] = useState(0);

  // Load initial layout state from database
  useEffect(() => {
    if (!sessionId) return;

    const loadInitialState = async () => {
      try {
        const response = await fetch(`/api/layouts/load?sessionId=${sessionId}`);
        if (response.ok) {
          const { layout } = await response.json();

          // Color scheme
          if (layout.colorScheme) {
            setColorScheme(layout.colorScheme);
          }

          // Custom colors
          if (layout.customColors) {
            try {
              const parsedCustomColors = JSON.parse(layout.customColors);
              setCustomColors(parsedCustomColors);
            } catch (error) {
              console.error('Error parsing custom colors:', error);
            }
          }

          // Weather effect
          if (layout.weatherEffect) {
            setWeatherEffect(layout.weatherEffect);
          }

          // Component layouts
          if (layout.componentLayouts) {
            try {
              const parsedLayouts = JSON.parse(layout.componentLayouts);
              setComponentLayouts(parsedLayouts);
            } catch (error) {
              console.error('Error parsing component layouts:', error);
            }
          }

          // Scene layer visibility - explicitly check for false to respect hidden state
          setSceneLayers(prev =>
            prev.map(layer => {
              if (layer.id === 'weather')
                return { ...layer, visible: layout.weatherVisible === false ? false : true };
              if (layer.id === 'chat')
                return { ...layer, visible: layout.chatVisible === false ? false : true };
              if (layer.id === 'nowplaying')
                return { ...layer, visible: layout.nowPlayingVisible === false ? false : true };
              if (layer.id === 'countdown')
                return { ...layer, visible: layout.countdownVisible === false ? false : true };
              if (layer.id === 'chathighlight')
                return { ...layer, visible: layout.chatHighlightVisible === false ? false : true };
              if (layer.id === 'paintbynumbers')
                return { ...layer, visible: layout.paintByNumbersVisible === false ? false : true };
              return layer;
            })
          );

          // Load countdown timers
          try {
            const timersResponse = await fetch(`/api/timers/list?sessionId=${sessionId}`);
            if (timersResponse.ok) {
              const { timers } = await timersResponse.json();
              setCountdownTimers(timers);
            }
          } catch (error) {
            console.error('Error loading countdown timers:', error);
          }

          // Load background settings
          if (layout.backgroundImageUrl) {
            setBackgroundImageUrl(layout.backgroundImageUrl);
          }
          if (layout.backgroundOpacity !== null && layout.backgroundOpacity !== undefined) {
            setBackgroundOpacity(layout.backgroundOpacity);
          }
          if (layout.backgroundBlur !== null && layout.backgroundBlur !== undefined) {
            setBackgroundBlur(layout.backgroundBlur);
          }

          // Note: Paint by numbers state is handled by the dashboard and sent via socket
          // We don't load it here because we need template data to reconstruct the full state
        }
      } catch (error) {
        console.error('Error loading initial layout state:', error);
      }
    };

    loadInitialState();
  }, [sessionId]);

  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (message: ChatMessageType) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('color-scheme-change', (scheme: ColorScheme) => {
      setColorScheme(scheme);
    });

    socket.on('custom-colors-change', (colors: CustomColors) => {
      setCustomColors(colors);
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

    socket.on('background-change', (data: { backgroundImageUrl: string | null; backgroundOpacity: number; backgroundBlur: number }) => {
      setBackgroundImageUrl(data.backgroundImageUrl);
      setBackgroundOpacity(data.backgroundOpacity);
      setBackgroundBlur(data.backgroundBlur);
    });

    return () => {
      socket.off('chat-message');
      socket.off('color-scheme-change');
      socket.off('custom-colors-change');
      socket.off('weather-change');
      socket.off('now-playing');
      socket.off('scene-toggle');
      socket.off('countdown-timers');
      socket.off('emote-wall');
      socket.off('component-layouts');
      socket.off('chat-highlight');
      socket.off('paint-state');
      socket.off('background-change');
    };
  }, [socket]);

  const removeMessage = (id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  };

  const getLayerVisible = (layerId: string) => {
    return sceneLayers.find(l => l.id === layerId)?.visible ?? true;
  };

  // Generate color scheme styles from presets
  const colorSchemeStyles: Record<ColorScheme, string> = colorSchemePresets.reduce(
    (acc, preset) => {
      acc[preset.id] = preset.gradient;
      return acc;
    },
    {} as Record<ColorScheme, string>
  );

  // Add custom scheme fallback
  if (!colorSchemeStyles.custom) {
    colorSchemeStyles.custom = 'from-blue-900/20 to-purple-900/20';
  }

  // Generate custom gradient CSS from CustomColors using useMemo for proper React tracking
  const customGradientCSS = useMemo(() => {
    if (!customColors || colorScheme !== 'custom') {
      return '';
    }

    // Helper to convert hex to rgba for better OBS browser compatibility
    const hexToRgba = (hex: string, alpha: number): string => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Use rgba() instead of hex+alpha for better browser compatibility (especially OBS)
    // 0.8 = 80% opacity for vibrant colors
    const primaryColor = hexToRgba(customColors.primary, 0.8);
    const secondaryColor = hexToRgba(customColors.secondary, 0.8);

    let gradient = '';
    if (customColors.gradientType === 'linear') {
      // Simplified direction mapping - use degrees for maximum compatibility
      const directionMap: Record<string, string> = {
        'to-r': '90deg',
        'to-l': '270deg',
        'to-t': '0deg',
        'to-b': '180deg',
        'to-tr': '45deg',
        'to-tl': '315deg',
        'to-br': '135deg',
        'to-bl': '225deg',
      };
      const direction = directionMap[customColors.gradientDirection] || '135deg';
      gradient = `linear-gradient(${direction}, ${primaryColor}, ${secondaryColor})`;
    } else {
      gradient = `radial-gradient(circle, ${primaryColor}, ${secondaryColor})`;
    }
    return gradient;
  }, [customColors, colorScheme]);

  return {
    socket,
    isConnected,
    messages,
    colorScheme,
    customColors,
    customGradientCSS,
    weatherEffect,
    nowPlaying,
    countdownTimers,
    componentLayouts,
    sceneLayers,
    chatHighlight,
    paintByNumbersState,
    backgroundImageUrl,
    backgroundOpacity,
    backgroundBlur,
    removeMessage,
    getLayerVisible,
    colorSchemeStyles,
  };
}
