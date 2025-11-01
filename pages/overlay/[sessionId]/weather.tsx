// pages/overlay/[sessionId]/weather.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import WeatherEffect from '@/components/overlay/WeatherEffect';

export default function WeatherOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    weatherEffect,
    getLayerVisible,
    colorScheme,
    colorSchemeStyles,
    customGradientCSS,
  } = useOverlaySocket(sessionId as string);

  return (
    <div
      className={`
        relative w-screen h-screen overflow-hidden
        ${customGradientCSS ? '' : `bg-gradient-to-br ${colorSchemeStyles[colorScheme]}`}
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

      {/* Weather Effect */}
      {getLayerVisible('weather') && <WeatherEffect effect={weatherEffect} />}
    </div>
  );
}
