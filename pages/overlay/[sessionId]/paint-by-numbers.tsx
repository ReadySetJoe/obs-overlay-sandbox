// pages/overlay/[sessionId]/paint-by-numbers.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import PaintByNumbers from '@/components/overlay/PaintByNumbers';

export default function PaintByNumbersOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    paintByNumbersState,
    componentLayouts,
    getLayerVisible,
    colorScheme,
    customColors,
    colorSchemeStyles,
    customGradientCSS,
  } = useOverlaySocket(sessionId as string);

  const layout = componentLayouts.paintByNumbers || {
    position: 'top-left' as const,
    x: 0,
    y: 0,
    scale: 1,
    gridSize: 20,
  };

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

      {/* Paint by Numbers */}
      {getLayerVisible('paintbynumbers') && paintByNumbersState && (
        <PaintByNumbers
          paintState={paintByNumbersState}
          layout={layout}
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}
    </div>
  );
}
