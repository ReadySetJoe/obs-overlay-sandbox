// pages/overlay/[sessionId].tsx
'use client';

import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import WeatherEffect from '@/components/overlay/WeatherEffect';
import NowPlaying from '@/components/overlay/NowPlaying';
import CountdownTimerComponent from '@/components/overlay/CountdownTimer';
import EmoteWall from '@/components/overlay/EmoteWall';
import ChatHighlight from '@/components/overlay/ChatHighlight';
import PaintByNumbers from '@/components/overlay/PaintByNumbers';
import EventLabels from '@/components/overlay/EventLabels';
import StreamStats from '@/components/overlay/StreamStats';
import Alert from '@/components/overlay/Alert';
import { AlertConfig, AlertEvent, CountdownTimer, EventLabelsData, EventLabelsConfig, StreamStatsData, StreamStatsConfig } from '@/types/overlay';

export default function OverlayPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    weatherEffect,
    nowPlaying,
    countdownTimers: socketCountdownTimers,
    componentLayouts,
    chatHighlight,
    paintByNumbersState,
    getLayerVisible,
    colorScheme,
    customColors,
    colorSchemeStyles,
    customGradientCSS,
    fontFamily,
    backgroundImageUrl,
    backgroundOpacity,
    backgroundBlur,
    eventLabelsData: socketEventLabelsData,
    eventLabelsConfig: socketEventLabelsConfig,
    streamStatsData: socketStreamStatsData,
    streamStatsConfig: socketStreamStatsConfig,
    socket,
  } = useOverlaySocket(sessionId as string);

  // Local state for initial data (takes precedence until socket updates)
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [localCountdownTimers, setLocalCountdownTimers] = useState<CountdownTimer[]>([]);
  const [localEventLabelsData, setLocalEventLabelsData] = useState<EventLabelsData>({});
  const [localEventLabelsConfig, setLocalEventLabelsConfig] = useState<EventLabelsConfig | null>(null);
  const [localStreamStatsData, setLocalStreamStatsData] = useState<StreamStatsData | null>(null);
  const [localStreamStatsConfig, setLocalStreamStatsConfig] = useState<StreamStatsConfig | null>(null);

  // Use local data if not yet replaced by socket data
  const countdownTimers = initialDataLoaded && socketCountdownTimers.length === 0 ? localCountdownTimers : socketCountdownTimers;
  const eventLabelsData = initialDataLoaded && Object.keys(socketEventLabelsData).length === 0 ? localEventLabelsData : socketEventLabelsData;
  const eventLabelsConfig = initialDataLoaded && !socketEventLabelsConfig ? localEventLabelsConfig : socketEventLabelsConfig;
  const streamStatsData = initialDataLoaded && !socketStreamStatsData ? localStreamStatsData : socketStreamStatsData;
  const streamStatsConfig = initialDataLoaded && !socketStreamStatsConfig ? localStreamStatsConfig : socketStreamStatsConfig;

  // Alert state
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [alertQueue, setAlertQueue] = useState<AlertEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<{
    config: AlertConfig;
    event: AlertEvent;
  } | null>(null);

  // Load initial data from database (critical for OBS where page loads fresh each time)
  useEffect(() => {
    if (!sessionId) return;

    const loadInitialData = async () => {
      console.log('[Overlay] Loading initial data from database for session:', sessionId);

      try {
        // Load layout data (includes streamStatsData, streamStatsConfig, eventLabelsData, etc.)
        const layoutResponse = await fetch(`/api/layouts/load?sessionId=${sessionId}`);
        if (layoutResponse.ok) {
          const { layout } = await layoutResponse.json();
          console.log('[Overlay] Layout data loaded:', layout);

          // Parse and set event labels data
          if (layout.eventLabelsData) {
            try {
              const parsedEventLabelsData = JSON.parse(layout.eventLabelsData);
              setLocalEventLabelsData(parsedEventLabelsData);
              console.log('[Overlay] Event labels data loaded:', parsedEventLabelsData);
            } catch (error) {
              console.error('[Overlay] Error parsing event labels data:', error);
            }
          }

          // Parse and set stream stats data
          if (layout.streamStatsData) {
            try {
              const parsedStreamStatsData = JSON.parse(layout.streamStatsData);
              setLocalStreamStatsData(parsedStreamStatsData);
              console.log('[Overlay] Stream stats data loaded:', parsedStreamStatsData);
            } catch (error) {
              console.error('[Overlay] Error parsing stream stats data:', error);
            }
          }

          // Parse and set stream stats config
          if (layout.streamStatsConfig) {
            try {
              const parsedStreamStatsConfig = JSON.parse(layout.streamStatsConfig);
              setLocalStreamStatsConfig(parsedStreamStatsConfig);
              console.log('[Overlay] Stream stats config loaded:', parsedStreamStatsConfig);
            } catch (error) {
              console.error('[Overlay] Error parsing stream stats config:', error);
            }
          }

          // Event labels config is part of the socket hook's state
          // If needed, we can extract it from layout data here too
        }

        // Load countdown timers
        const timersResponse = await fetch(`/api/timers/list?sessionId=${sessionId}`);
        if (timersResponse.ok) {
          const { timers } = await timersResponse.json();
          setLocalCountdownTimers(timers);
          console.log('[Overlay] Countdown timers loaded:', timers);
        }

        // Mark initial data as loaded
        setInitialDataLoaded(true);
        console.log('[Overlay] ✅ All initial data loaded successfully');
      } catch (error) {
        console.error('[Overlay] Error loading initial data:', error);
        setInitialDataLoaded(true); // Set anyway to allow socket updates
      }
    };

    loadInitialData();
  }, [sessionId]);

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
    const config = alertConfigs.find(
      c => c.eventType === nextEvent.eventType && c.enabled
    );

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
    <div
      className='relative w-screen h-screen overflow-hidden'
      style={{ fontFamily }}
    >
      {/* Custom Background Layer (lowest) */}
      {backgroundImageUrl && (
        <div
          className='absolute inset-0 -z-10'
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
        <CountdownTimerComponent
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

      {/* Event Labels */}
      {getLayerVisible('eventlabels') && eventLabelsConfig &&
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

      {/* Stream Stats */}
      {getLayerVisible('streamstats') && streamStatsData && streamStatsConfig &&
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

      {/* Alerts */}
      {currentAlert && (
        <Alert
          config={currentAlert.config}
          event={currentAlert.event}
          onComplete={handleAlertComplete}
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}
    </div>
  );
}
