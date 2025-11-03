// hooks/useAlerts.ts
import { useState, useEffect, useCallback } from 'react';
import { AlertConfig, AlertEventType } from '@/types/overlay';

interface UseAlertsProps {
  sessionId: string | undefined;
}

export function useAlerts({ sessionId }: UseAlertsProps) {
  const [alertConfigs, setAlertConfigs] = useState<
    Record<AlertEventType, Partial<AlertConfig>>
  >({
    follow: {},
    sub: {},
    bits: {},
    raid: {},
    giftsub: {},
  });
  const [loading, setLoading] = useState(true);

  // Load alert configurations
  const loadAlerts = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/alerts/list?sessionId=${sessionId}`);
      if (response.ok) {
        const { alerts } = await response.json();

        const configsMap: Record<AlertEventType, Partial<AlertConfig>> = {
          follow: {},
          sub: {},
          bits: {},
          raid: {},
          giftsub: {},
        };

        alerts.forEach((alert: AlertConfig) => {
          configsMap[alert.eventType as AlertEventType] = alert;
        });

        setAlertConfigs(configsMap);
      }
    } catch (error) {
      console.error('Error loading alert configs:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Count configured alerts (have an ID in database)
  const totalConfiguredCount = Object.values(alertConfigs).filter(
    config => config.id !== undefined
  ).length;

  // Count enabled alerts (configured AND enabled)
  const enabledAlertsCount = Object.values(alertConfigs).filter(
    config => config.id !== undefined && config.enabled === true
  ).length;

  return {
    alertConfigs,
    loading,
    totalConfiguredCount,
    enabledAlertsCount,
    refetch: loadAlerts,
  };
}
