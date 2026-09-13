// pages/overlay/[sessionId]/stream-stats.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import StreamStats from '@/components/overlay/StreamStats';
import ConnectionStatus from '@/components/overlay/ConnectionStatus';
import ResolutionWarning from '@/components/overlay/ResolutionWarning';

export default function StreamStatsOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    streamStatsData,
    streamStatsConfig,
    componentLayouts,
    getLayerVisible,
    colorScheme,
    customColors,
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
      <ResolutionWarning />

      {/* Stream Stats */}
      {getLayerVisible('streamstats') &&
        (() => {
          const layout = componentLayouts.streamStats || {
            position: 'top-right',
            x: 20,
            y: 20,
            scale: 1,
            displayMode: 'full',
          };

          return (
            <div
              className='fixed transition-all duration-500'
              style={{
                zIndex: 16,
                left: `${layout.x}px`,
                top: `${layout.y}px`,
              }}
            >
              <StreamStats
                data={streamStatsData}
                config={streamStatsConfig}
                scale={layout.scale}
                colorScheme={colorScheme}
                customColors={customColors}
                displayMode={layout.displayMode}
              />
            </div>
          );
        })()}
    </div>
  );
}
