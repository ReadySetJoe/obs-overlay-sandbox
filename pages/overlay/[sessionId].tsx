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
import Wheel from '@/components/overlay/Wheel';
import {
  AlertConfig,
  AlertEvent,
  CountdownTimer,
  EventLabelsData,
  StreamStatsData,
  StreamStatsConfig,
  WheelConfig,
  WheelSpinEvent,
} from '@/types/overlay';

export default function OverlayPage() {
  const router = useRouter();
  const { sessionId, debug } = router.query;
  const showDebug = debug === 'true';
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
  const [localCountdownTimers, setLocalCountdownTimers] = useState<
    CountdownTimer[]
  >([]);
  const [localEventLabelsData, setLocalEventLabelsData] =
    useState<EventLabelsData>({});
  const [localStreamStatsData, setLocalStreamStatsData] =
    useState<StreamStatsData | null>(null);
  const [localStreamStatsConfig, setLocalStreamStatsConfig] =
    useState<StreamStatsConfig | null>(null);

  // Debug state
  const [debugInfo, setDebugInfo] = useState({
    pageLoaded: new Date().toISOString(),
    layoutFetchStatus: 'pending',
    timersFetchStatus: 'pending',
    socketConnectTime: null as string | null,
    socketEventsReceived: [] as string[],
    errors: [] as string[],
  });

  // Use local data if not yet replaced by socket data
  const countdownTimers =
    initialDataLoaded && socketCountdownTimers.length === 0
      ? localCountdownTimers
      : socketCountdownTimers;
  const eventLabelsData =
    initialDataLoaded && Object.keys(socketEventLabelsData).length === 0
      ? localEventLabelsData
      : socketEventLabelsData;
  const eventLabelsConfig = socketEventLabelsConfig;
  const streamStatsData =
    initialDataLoaded && !socketStreamStatsData
      ? localStreamStatsData
      : socketStreamStatsData;
  const streamStatsConfig =
    initialDataLoaded && !socketStreamStatsConfig
      ? localStreamStatsConfig
      : socketStreamStatsConfig;

  // Alert state
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [alertQueue, setAlertQueue] = useState<AlertEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<{
    config: AlertConfig;
    event: AlertEvent;
  } | null>(null);

  // Wheel state
  const [wheels, setWheels] = useState<WheelConfig[]>([]);
  const [wheelSpinEvent, setWheelSpinEvent] = useState<WheelSpinEvent | null>(
    null
  );

  // Load initial data from database (critical for OBS where page loads fresh each time)
  useEffect(() => {
    if (!sessionId) return;

    const loadInitialData = async () => {
      console.log(
        '[Overlay] Loading initial data from database for session:',
        sessionId
      );

      try {
        // Load layout data (includes streamStatsData, streamStatsConfig, eventLabelsData, etc.)
        setDebugInfo(prev => ({ ...prev, layoutFetchStatus: 'fetching' }));
        const layoutResponse = await fetch(
          `/api/layouts/load?sessionId=${sessionId}`
        );

        if (layoutResponse.ok) {
          const { layout } = await layoutResponse.json();
          console.log('[Overlay] Layout data loaded:', layout);
          setDebugInfo(prev => ({ ...prev, layoutFetchStatus: 'success' }));

          // Parse and set event labels data
          if (layout.eventLabelsData) {
            try {
              const parsedEventLabelsData = JSON.parse(layout.eventLabelsData);
              setLocalEventLabelsData(parsedEventLabelsData);
              console.log(
                '[Overlay] Event labels data loaded:',
                parsedEventLabelsData
              );
            } catch (error) {
              console.error(
                '[Overlay] Error parsing event labels data:',
                error
              );
              setDebugInfo(prev => ({
                ...prev,
                errors: [...prev.errors, `Event labels parse error: ${error}`],
              }));
            }
          }

          // Parse and set stream stats data
          if (layout.streamStatsData) {
            try {
              const parsedStreamStatsData = JSON.parse(layout.streamStatsData);
              setLocalStreamStatsData(parsedStreamStatsData);
              console.log(
                '[Overlay] Stream stats data loaded:',
                parsedStreamStatsData
              );
            } catch (error) {
              console.error(
                '[Overlay] Error parsing stream stats data:',
                error
              );
              setDebugInfo(prev => ({
                ...prev,
                errors: [...prev.errors, `Stream stats parse error: ${error}`],
              }));
            }
          }

          // Parse and set stream stats config
          if (layout.streamStatsConfig) {
            try {
              const parsedStreamStatsConfig = JSON.parse(
                layout.streamStatsConfig
              );
              setLocalStreamStatsConfig(parsedStreamStatsConfig);
              console.log(
                '[Overlay] Stream stats config loaded:',
                parsedStreamStatsConfig
              );
            } catch (error) {
              console.error(
                '[Overlay] Error parsing stream stats config:',
                error
              );
              setDebugInfo(prev => ({
                ...prev,
                errors: [
                  ...prev.errors,
                  `Stream stats config parse error: ${error}`,
                ],
              }));
            }
          }
        } else {
          setDebugInfo(prev => ({
            ...prev,
            layoutFetchStatus: 'error',
            errors: [
              ...prev.errors,
              `Layout fetch failed: ${layoutResponse.status}`,
            ],
          }));
        }

        // Load countdown timers
        setDebugInfo(prev => ({ ...prev, timersFetchStatus: 'fetching' }));
        const timersResponse = await fetch(
          `/api/timers/list?sessionId=${sessionId}`
        );

        if (timersResponse.ok) {
          const { timers } = await timersResponse.json();
          setLocalCountdownTimers(timers);
          console.log('[Overlay] Countdown timers loaded:', timers);
          setDebugInfo(prev => ({ ...prev, timersFetchStatus: 'success' }));
        } else {
          setDebugInfo(prev => ({
            ...prev,
            timersFetchStatus: 'error',
            errors: [
              ...prev.errors,
              `Timers fetch failed: ${timersResponse.status}`,
            ],
          }));
        }

        // Load wheels
        const wheelsResponse = await fetch(
          `/api/wheels/list?sessionId=${sessionId}`
        );
        if (wheelsResponse.ok) {
          const { wheels: loadedWheels } = await wheelsResponse.json();
          setWheels(loadedWheels);
          console.log('[Overlay] Wheels loaded:', loadedWheels);
        }

        // Mark initial data as loaded
        setInitialDataLoaded(true);
        console.log('[Overlay] ✅ All initial data loaded successfully');
      } catch (error) {
        console.error('[Overlay] Error loading initial data:', error);
        setDebugInfo(prev => ({
          ...prev,
          layoutFetchStatus: 'error',
          timersFetchStatus: 'error',
          errors: [...prev.errors, `Fatal error: ${error}`],
        }));
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

  // Track socket connection for debug
  useEffect(() => {
    if (isConnected && !debugInfo.socketConnectTime) {
      setDebugInfo(prev => ({
        ...prev,
        socketConnectTime: new Date().toISOString(),
      }));
    }
  }, [isConnected, debugInfo.socketConnectTime]);

  // Track socket events for debug
  useEffect(() => {
    if (!socket) return;

    const trackEvent = (eventName: string) => {
      setDebugInfo(prev => ({
        ...prev,
        socketEventsReceived: [
          ...prev.socketEventsReceived.slice(-9), // Keep last 10 events
          `${eventName} @ ${new Date().toLocaleTimeString()}`,
        ],
      }));
    };

    socket.on('color-scheme-change', () => trackEvent('color-scheme-change'));
    socket.on('custom-colors-change', () => trackEvent('custom-colors-change'));
    socket.on('event-labels-update', () => trackEvent('event-labels-update'));
    socket.on('stream-stats-update', () => trackEvent('stream-stats-update'));
    socket.on('countdown-timers', () => trackEvent('countdown-timers'));
    socket.on('alert-trigger', () => trackEvent('alert-trigger'));
    socket.on('chat-highlight', () => trackEvent('chat-highlight'));
    socket.on('background-change', () => trackEvent('background-change'));
    socket.on('wheel-config-update', () => trackEvent('wheel-config-update'));
    socket.on('wheel-list-update', () => trackEvent('wheel-list-update'));
    socket.on('wheel-spin', () => trackEvent('wheel-spin'));

    return () => {
      socket.off('color-scheme-change');
      socket.off('custom-colors-change');
      socket.off('event-labels-update');
      socket.off('stream-stats-update');
      socket.off('countdown-timers');
      socket.off('alert-trigger');
      socket.off('chat-highlight');
      socket.off('background-change');
      socket.off('wheel-config-update');
      socket.off('wheel-list-update');
      socket.off('wheel-spin');
    };
  }, [socket]);

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

  // Listen for wheel updates
  useEffect(() => {
    if (!socket) return;

    const handleWheelConfigUpdate = (data: { wheel: WheelConfig }) => {
      setWheels(prev =>
        prev.map(w => (w.id === data.wheel.id ? data.wheel : w))
      );
    };

    const handleWheelListUpdate = (data: { wheels: WheelConfig[] }) => {
      setWheels(data.wheels);
    };

    const handleWheelSpin = (data: WheelSpinEvent) => {
      setWheelSpinEvent(data);
    };

    socket.on('wheel-config-update', handleWheelConfigUpdate);
    socket.on('wheel-list-update', handleWheelListUpdate);
    socket.on('wheel-spin', handleWheelSpin);

    return () => {
      socket.off('wheel-config-update', handleWheelConfigUpdate);
      socket.off('wheel-list-update', handleWheelListUpdate);
      socket.off('wheel-spin', handleWheelSpin);
    };
  }, [socket]);

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
          ${customGradientCSS ? '' : `bg-linear-to-br ${colorSchemeStyles[colorScheme]}`}
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

      {/* Debug Panel - Add ?debug=true to URL to show */}
      {showDebug && (
        <div className='fixed top-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-2xl z-9999 max-w-md text-xs font-mono border-2 border-green-500'>
          <div className='text-lg font-bold mb-3 text-green-400'>
            🔍 OBS Debug Panel
          </div>

          {/* Session Info */}
          <div className='mb-3 pb-3 border-b border-gray-700'>
            <div className='font-semibold text-yellow-400 mb-1'>Session</div>
            <div className='truncate'>ID: {sessionId || 'Not loaded'}</div>
            <div>
              Loaded: {debugInfo.pageLoaded.split('T')[1].split('.')[0]}
            </div>
          </div>

          {/* Socket Status */}
          <div className='mb-3 pb-3 border-b border-gray-700'>
            <div className='font-semibold text-yellow-400 mb-1'>
              Socket Status
            </div>
            <div className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? '✅ Connected' : '❌ Disconnected'}
            </div>
            {debugInfo.socketConnectTime && (
              <div className='text-xs text-gray-400'>
                Connected at:{' '}
                {debugInfo.socketConnectTime.split('T')[1].split('.')[0]}
              </div>
            )}
          </div>

          {/* Data Loading Status */}
          <div className='mb-3 pb-3 border-b border-gray-700'>
            <div className='font-semibold text-yellow-400 mb-1'>
              Data Loading
            </div>
            <div className='space-y-1'>
              <div>
                Layout:
                <span
                  className={
                    debugInfo.layoutFetchStatus === 'success'
                      ? 'text-green-400 ml-1'
                      : debugInfo.layoutFetchStatus === 'fetching'
                        ? 'text-yellow-400 ml-1'
                        : debugInfo.layoutFetchStatus === 'error'
                          ? 'text-red-400 ml-1'
                          : 'text-gray-400 ml-1'
                  }
                >
                  {debugInfo.layoutFetchStatus}
                </span>
              </div>
              <div>
                Timers:
                <span
                  className={
                    debugInfo.timersFetchStatus === 'success'
                      ? 'text-green-400 ml-1'
                      : debugInfo.timersFetchStatus === 'fetching'
                        ? 'text-yellow-400 ml-1'
                        : debugInfo.timersFetchStatus === 'error'
                          ? 'text-red-400 ml-1'
                          : 'text-gray-400 ml-1'
                  }
                >
                  {debugInfo.timersFetchStatus}
                </span>
              </div>
              <div>Initial Load: {initialDataLoaded ? '✅' : '⏳'}</div>
            </div>
          </div>

          {/* Data Counts */}
          <div className='mb-3 pb-3 border-b border-gray-700'>
            <div className='font-semibold text-yellow-400 mb-1'>
              Loaded Data
            </div>
            <div className='space-y-1'>
              <div>Countdown Timers: {countdownTimers.length}</div>
              <div>Alert Configs: {alertConfigs.length}</div>
              <div>
                Event Labels: {Object.keys(eventLabelsData).length} fields
              </div>
              <div>Stream Stats Data: {streamStatsData ? '✅' : '❌'}</div>
              <div>Stream Stats Config: {streamStatsConfig ? '✅' : '❌'}</div>
            </div>
          </div>

          {/* Recent Socket Events */}
          <div className='mb-3 pb-3 border-b border-gray-700'>
            <div className='font-semibold text-yellow-400 mb-1'>
              Recent Events (last 10)
            </div>
            {debugInfo.socketEventsReceived.length === 0 ? (
              <div className='text-gray-500 italic'>No events yet</div>
            ) : (
              <div className='space-y-1 max-h-32 overflow-y-auto'>
                {debugInfo.socketEventsReceived.map((event, i) => (
                  <div key={i} className='text-green-300 text-[10px]'>
                    {event}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {debugInfo.errors.length > 0 && (
            <div className='mb-3'>
              <div className='font-semibold text-red-400 mb-1'>⚠️ Errors</div>
              <div className='space-y-1 max-h-32 overflow-y-auto'>
                {debugInfo.errors.map((error, i) => (
                  <div
                    key={i}
                    className='text-red-300 text-[10px] wrap-break-word'
                  >
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Usage Tip */}
          <div className='text-[10px] text-gray-500 italic mt-2'>
            Remove ?debug=true from URL to hide this panel
          </div>
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
      {getLayerVisible('eventlabels') &&
        eventLabelsConfig &&
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
      {getLayerVisible('streamstats') &&
        streamStatsData &&
        streamStatsConfig &&
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

      {/* Wheel Spinner */}
      {getLayerVisible('wheel') &&
        (() => {
          const activeWheel = wheels.find(w => w.isActive);
          if (!activeWheel) return null;

          return (
            <Wheel
              config={activeWheel}
              spinEvent={wheelSpinEvent}
              colorScheme={colorScheme}
              customColors={customColors}
            />
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
