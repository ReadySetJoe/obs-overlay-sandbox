// pages/overlay/[sessionId]/alerts.tsx
'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import {
  AlertConfig,
  AlertEvent,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import Alert from '@/components/overlay/Alert';

export default function AlertsOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { socket, isConnected } = useSocket(sessionId as string);

  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [alertQueue, setAlertQueue] = useState<AlertEvent[]>([]);
  const [currentAlert, setCurrentAlert] = useState<{
    config: AlertConfig;
    event: AlertEvent;
  } | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);

  // Load alert configurations and color scheme
  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      try {
        // Load alerts
        const alertsResponse = await fetch(
          `/api/alerts/list?sessionId=${sessionId}`
        );
        if (alertsResponse.ok) {
          const { alerts } = await alertsResponse.json();
          setAlertConfigs(alerts);
        }

        // Load color scheme
        const layoutResponse = await fetch(
          `/api/layouts/load?sessionId=${sessionId}`
        );
        if (layoutResponse.ok) {
          const { layout } = await layoutResponse.json();
          if (layout.colorScheme) {
            setColorScheme(layout.colorScheme);
          }
          if (layout.customColors) {
            try {
              setCustomColors(JSON.parse(layout.customColors));
            } catch (error) {
              console.error('Error parsing custom colors:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
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

  // Listen for color scheme changes
  useEffect(() => {
    if (!socket) return;

    socket.on('color-scheme-change', (scheme: ColorScheme) => {
      setColorScheme(scheme);
    });

    socket.on('custom-colors-change', (colors: CustomColors) => {
      setCustomColors(colors);
    });

    return () => {
      socket.off('color-scheme-change');
      socket.off('custom-colors-change');
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
    <div className='relative w-screen h-screen overflow-hidden bg-transparent'>
      {/* Connection Status */}
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}

      {/* Current Alert */}
      {currentAlert && (
        <Alert
          config={currentAlert.config}
          event={currentAlert.event}
          onComplete={handleAlertComplete}
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}

      {/* Debug Info (only visible in dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className='fixed bottom-4 left-4 bg-black/80 text-white px-4 py-2 rounded text-xs'>
          Queue: {alertQueue.length} | Configs: {alertConfigs.length} | Current:{' '}
          {currentAlert ? 'Yes' : 'No'}
        </div>
      )}
    </div>
  );
}
