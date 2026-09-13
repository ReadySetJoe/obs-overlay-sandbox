// pages/overlay/[sessionId]/countdown.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import CountdownTimer from '@/components/overlay/CountdownTimer';
import ConnectionStatus from '@/components/overlay/ConnectionStatus';

export default function CountdownOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    countdownTimers,
    componentLayouts,
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

      {/* Countdown Timers */}
      {
        <CountdownTimer
          timers={countdownTimers}
          layout={componentLayouts.countdown}
          colorScheme={colorScheme}
          customColors={customColors}
        />
      }
    </div>
  );
}
