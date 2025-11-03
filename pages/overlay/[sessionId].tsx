// pages/overlay/[sessionId].tsx
'use client';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import WeatherEffect from '@/components/overlay/WeatherEffect';
import NowPlaying from '@/components/overlay/NowPlaying';
import CountdownTimer from '@/components/overlay/CountdownTimer';
import EmoteWall from '@/components/overlay/EmoteWall';
import ChatHighlight from '@/components/overlay/ChatHighlight';
import PaintByNumbers from '@/components/overlay/PaintByNumbers';
import Alert from '@/components/overlay/Alert';
import { AlertConfig, AlertEvent } from '@/types/overlay';

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
    paintByNumbersState,
    getLayerVisible,
    colorScheme,
    customColors,
    colorSchemeStyles,
    customGradientCSS,
    backgroundImageUrl,
    backgroundOpacity,
    backgroundBlur,
    socket,
  } = useOverlaySocket(sessionId as string);

  // Alert state
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [alertQueue, setAlertQueue] = useState<AlertEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<{config: AlertConfig; event: AlertEvent} | null>(null);

  // Load alert configurations
  useEffect(() => {
    if (!sessionId) return;

    const loadAlerts = async () => {
      try {
        const response = await fetch(`/api/alerts/list?sessionId=${sessionId}`);
        if (response.ok) {
          const { alerts } = await response.json();
          setAlertConfigs(alerts);
        }
      } catch (error) {
        console.error('Error loading alert configs:', error);
      }
    };

    loadAlerts();
  }, [sessionId]);

  // Listen for alert triggers
  useEffect(() => {
    if (!socket) return;

    const handleAlertTrigger = async (event: AlertEvent) => {
      console.log('Alert triggered:', event);

      // Reload configs to ensure we have the latest configuration
      try {
        const response = await fetch(`/api/alerts/list?sessionId=${sessionId}`);
        if (response.ok) {
          const { alerts } = await response.json();
          setAlertConfigs(alerts);
        }
      } catch (error) {
        console.error('Error reloading alert configs:', error);
      }

      // Add to queue
      setAlertQueue(prev => [...prev, event]);
    };

    socket.on('alert-trigger', handleAlertTrigger);

    return () => {
      socket.off('alert-trigger', handleAlertTrigger);
    };
  }, [socket, sessionId]);

  // Process alert queue
  useEffect(() => {
    if (currentAlert || alertQueue.length === 0) return;

    const nextEvent = alertQueue[0];
    const config = alertConfigs.find(c => c.eventType === nextEvent.eventType && c.enabled);

    if (config) {
      setCurrentAlert({ config, event: nextEvent });
    }

    // Remove from queue regardless of whether we found a config
    setAlertQueue(prev => prev.slice(1));
  }, [alertQueue, currentAlert, alertConfigs]);

  const handleAlertComplete = () => {
    setCurrentAlert(null);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Custom Background Layer (lowest) */}
      {backgroundImageUrl && (
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundOpacity || 1,
            filter: `blur(${backgroundBlur || 0}px)`,
          }}
        />
      )}

      {/* Gradient Background (fallback - only visible when no custom background) */}
      <div
        className={`
          absolute inset-0 -z-20
          ${customGradientCSS ? '' : `bg-gradient-to-br ${colorSchemeStyles[colorScheme]}`}
          transition-all duration-1000
          ${backgroundImageUrl ? 'opacity-0' : 'opacity-100'}
        `}
        style={customGradientCSS ? { background: customGradientCSS } : {}}
      />
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
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}

      {/* Emote Wall */}
      <EmoteWall />

      {/* Chat Highlight */}
      {getLayerVisible('chathighlight') && (
        <ChatHighlight
          highlight={chatHighlight}
          layout={componentLayouts.chatHighlight}
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}

      {/* Paint by Numbers */}
      {getLayerVisible('paintbynumbers') && (
        <PaintByNumbers
          paintState={paintByNumbersState}
          layout={
            componentLayouts.paintByNumbers || {
              position: 'top-left',
              x: 0,
              y: 0,
              scale: 1,
              gridSize: 20,
            }
          }
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}

      {/* Alerts */}
      {currentAlert && (
        <Alert
          config={currentAlert.config}
          event={currentAlert.event}
          onComplete={handleAlertComplete}
        />
      )}
    </div>
  );
}
