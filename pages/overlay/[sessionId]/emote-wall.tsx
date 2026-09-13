// pages/overlay/[sessionId]/emote-wall.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import EmoteWall from '@/components/overlay/EmoteWall';
import ConnectionStatus from '@/components/overlay/ConnectionStatus';
import ResolutionWarning from '@/components/overlay/ResolutionWarning';

export default function EmoteWallOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { isConnected, colorScheme, colorSchemeStyles, customGradientCSS } =
    useOverlaySocket(sessionId as string);

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
      <ResolutionWarning />

      {/* Emote Wall */}
      <EmoteWall />
    </div>
  );
}
