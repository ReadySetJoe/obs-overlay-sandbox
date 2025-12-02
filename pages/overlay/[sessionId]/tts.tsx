// pages/overlay/[sessionId]/tts.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import TextToSpeech from '@/components/overlay/TextToSpeech';
import { TTSConfig } from '@/types/overlay';

// Default config for when no TTS config exists yet
const DEFAULT_TTS_CONFIG: TTSConfig = {
  id: 'default',
  layoutId: 'default',
  voice: 'Google US English',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  maxQueueSize: 5,
  showVisualizer: true,
  visualizerPosition: 'bottom-right',
  visualizerStyle: 'waveform',
  backgroundColor: '#000000',
  textColor: '#ffffff',
  filterProfanity: true,
  allowedSources: 'chat,alerts,manual',
  chatPermissions: 'everyone',
  minCharLength: 5,
  maxCharLength: 200,
  cooldownSeconds: 30,
  position: 'custom',
  scale: 1.0,
  x: 20,
  y: 20,
};

export default function TTSOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    ttsConfig,
    componentLayouts,
    getLayerVisible,
    colorScheme,
    colorSchemeStyles,
    customGradientCSS,
    customColors,
    socket,
  } = useOverlaySocket(sessionId as string);

  return (
    <div
      className={`
        relative w-screen h-screen overflow-hidden
        ${customGradientCSS ? '' : `bg-linear-to-br ${colorSchemeStyles[colorScheme]}`}
        transition-all duration-1000
      `}
      style={customGradientCSS ? { background: customGradientCSS } : {}}
    >
      {/* Connection Status */}
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}

      {/* Text to Speech - Always render with default config if none exists */}
      {getLayerVisible('tts') && (
        <TextToSpeech
          config={ttsConfig || DEFAULT_TTS_CONFIG}
          layout={{
            position: ttsConfig?.position || 'bottom-right',
            scale: ttsConfig?.scale || 1,
            x: ttsConfig?.x || 20,
            y: ttsConfig?.y || 20,
          }}
          colorScheme={colorScheme}
          customColors={customColors}
          socket={socket}
        />
      )}
    </div>
  );
}
