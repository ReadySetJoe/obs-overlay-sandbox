// pages/overlay/[sessionId]/tts.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import TextToSpeech from '@/components/overlay/TextToSpeech';

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

      {/* Text to Speech */}
      {getLayerVisible('tts') && ttsConfig && (
        <TextToSpeech
          config={ttsConfig}
          layout={componentLayouts.tts || { position: 'bottom-right', scale: 1 }}
          colorScheme={colorScheme}
          customColors={customColors}
          socket={socket}
        />
      )}
    </div>
  );
}
