// pages/overlay/[sessionId].tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSocket } from '@/hooks/useSocket';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import ChatMessage from '@/components/overlay/ChatMessage';
import ParticleSystem from '@/components/overlay/ParticleSystem';
import WeatherEffect from '@/components/overlay/WeatherEffect';
import NowPlaying from '@/components/overlay/NowPlaying';
import {
  ChatMessage as ChatMessageType,
  ColorScheme,
  WeatherEffect as WeatherEffectType,
  NowPlaying as NowPlayingType,
  SceneLayer,
} from '@/types/overlay';

export default function OverlayPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { socket, isConnected } = useSocket(sessionId as string);
  const {
    audioLevel: liveAudioLevel,
    frequencyData,
    isListening,
    startListening,
    stopListening,
  } = useAudioAnalyzer();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffectType>('none');
  const [nowPlaying, setNowPlaying] = useState<NowPlayingType | null>(null);
  const [useAudioReactivity, setUseAudioReactivity] = useState(true);
  const [visualizerConfig, setVisualizerConfig] = useState({
    size: 1.0,
    x: 50,
    y: 50,
  });
  const [sceneLayers, setSceneLayers] = useState<SceneLayer[]>([
    { id: 'particles', name: 'Particles', visible: true, zIndex: 1 },
    { id: 'weather', name: 'Weather', visible: true, zIndex: 2 },
    { id: 'chat', name: 'Chat', visible: true, zIndex: 5 },
    { id: 'nowplaying', name: 'Now Playing', visible: true, zIndex: 10 },
  ]);

  // Auto-enable audio reactivity on mount
  useEffect(() => {
    if (useAudioReactivity && !isListening) {
      startListening();
    }
  }, []);

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

    socket.on(
      'visualizer-config',
      (config: { size: number; x: number; y: number }) => {
        setVisualizerConfig(config);
      }
    );

    return () => {
      socket.off('chat-message');
      socket.off('color-scheme-change');
      socket.off('weather-change');
      socket.off('now-playing');
      socket.off('scene-toggle');
      socket.off('visualizer-config');
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
  };

  return (
    <div
      className={`
        relative w-screen h-screen overflow-hidden
        bg-gradient-to-br ${colorSchemeStyles[colorScheme]}
        transition-all duration-1000
      `}
    >
      {/* Connection Status */}
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}

      {/* Audio Reactivity Status */}
      <div className='fixed top-4 left-4 z-50 flex items-center gap-2'>
        {isListening ? (
          <div className='bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-green-500/30'>
            <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
            <span className='text-xs font-semibold'>Audio Reactive</span>
            <button
              onClick={() => {
                stopListening();
                setUseAudioReactivity(false);
              }}
              className='ml-2 px-2 py-0.5 bg-red-600/80 hover:bg-red-600 rounded text-xs transition'
            >
              Disable
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              startListening();
              setUseAudioReactivity(true);
            }}
            className='bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-700/90 transition border border-gray-600 text-xs font-semibold'
          >
            Enable Audio Reactive
          </button>
        )}
      </div>

      {/* Particle System */}
      {getLayerVisible('particles') && (
        <ParticleSystem
          audioLevel={liveAudioLevel}
          frequencyData={useAudioReactivity ? frequencyData : undefined}
          colorScheme={colorScheme}
          size={visualizerConfig.size}
          x={visualizerConfig.x}
          y={visualizerConfig.y}
        />
      )}

      {/* Weather Effect */}
      {getLayerVisible('weather') && <WeatherEffect effect={weatherEffect} />}

      {/* Chat Messages */}
      {getLayerVisible('chat') && (
        <div
          className='fixed top-20 right-8 max-w-md space-y-3'
          style={{ zIndex: 5 }}
        >
          {messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
              onComplete={() => removeMessage(message.id)}
            />
          ))}
        </div>
      )}

      {/* Now Playing */}
      {getLayerVisible('nowplaying') && <NowPlaying track={nowPlaying} />}
    </div>
  );
}
