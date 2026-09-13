// pages/overlay/[sessionId]/weather.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import WeatherEffect from '@/components/overlay/WeatherEffect';
import ConnectionStatus from '@/components/overlay/ConnectionStatus';

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
        ${customGradientCSS ? '' : `bg-linear-to-br ${colorSchemeStyles[colorScheme]}`}
        transition-all duration-1000
      `}
      style={customGradientCSS ? { background: customGradientCSS } : {}}
    >
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />

      {/* Weather Effect */}
      {getLayerVisible('weather') && <WeatherEffect effect={weatherEffect} />}
    </div>
  );
}
