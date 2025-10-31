// pages/overlay/[sessionId].tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import WeatherEffect from '@/components/overlay/WeatherEffect';
import NowPlaying from '@/components/overlay/NowPlaying';
import CountdownTimer from '@/components/overlay/CountdownTimer';
import EmoteWall from '@/components/overlay/EmoteWall';
import ChatHighlight from '@/components/overlay/ChatHighlight';

export default function OverlayPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    weatherEffect,
    nowPlaying,
    countdownTimers,
    componentLayouts,
    chatHighlight,
    getLayerVisible,
    colorScheme,
    colorSchemeStyles,
  } = useOverlaySocket(sessionId as string);

  return (
    <div
      className={`
        relative w-screen h-screen overflow-hidden
        bg-gradient-to-br ${colorSchemeStyles[colorScheme]}
        transition-all duration-1000
      `}
    >
      {/* Connection Status */}
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}

      {/* Weather Effect */}
      {getLayerVisible('weather') && <WeatherEffect effect={weatherEffect} />}

      {/* Now Playing */}
      {getLayerVisible('nowplaying') && (
        <NowPlaying track={nowPlaying} layout={componentLayouts.nowPlaying} />
      )}

      {/* Countdown Timers */}
      {getLayerVisible('countdown') && (
        <CountdownTimer
          timers={countdownTimers}
          layout={componentLayouts.countdown}
        />
      )}

      {/* Emote Wall */}
      <EmoteWall />

      {/* Chat Highlight */}
      {getLayerVisible('chathighlight') && (
        <ChatHighlight
          highlight={chatHighlight}
          layout={componentLayouts.chatHighlight}
        />
      )}
    </div>
  );
}
