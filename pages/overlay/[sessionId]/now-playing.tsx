// pages/overlay/[sessionId]/now-playing.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import NowPlaying from '@/components/overlay/NowPlaying';
import ConnectionStatus from '@/components/overlay/ConnectionStatus';

export default function NowPlayingOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    nowPlaying,
    componentLayouts,
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

      {/* Now Playing */}
      {getLayerVisible('nowplaying') && (
        <NowPlaying track={nowPlaying} layout={componentLayouts.nowPlaying} />
      )}
    </div>
  );
}
