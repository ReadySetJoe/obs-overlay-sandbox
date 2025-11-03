// pages/overlay/[sessionId]/event-labels.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import EventLabels from '@/components/overlay/EventLabels';

export default function EventLabelsOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    eventLabelsData,
    eventLabelsConfig,
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

      {/* Event Labels */}
      {getLayerVisible('eventlabels') &&
        (() => {
          const layout = componentLayouts.eventLabels || {
            position: 'top-right',
            x: 20,
            y: 20,
            scale: 1,
          };

          return (
            <div
              className='fixed transition-all duration-500'
              style={{
                zIndex: 15,
                left: `${layout.x}px`,
                top: `${layout.y}px`,
              }}
            >
              <EventLabels
                data={eventLabelsData}
                config={eventLabelsConfig}
                scale={layout.scale}
                colorScheme={colorScheme}
                customColors={customColors}
              />
            </div>
          );
        })()}
    </div>
  );
}
