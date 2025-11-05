// hooks/useAlertConfig.ts
import { useState, useEffect, useCallback } from 'react';
import { AlertConfig, AlertEventType } from '@/types/overlay';

const DEFAULT_MESSAGES: Record<AlertEventType, string> = {
  follow: '{username} just followed!',
  sub: '{username} just subscribed!',
  bits: '{username} cheered {amount} bits!',
  raid: '{username} is raiding with {count} viewers!',
  giftsub: '{username} gifted a sub!',
};

export function useAlertConfig(sessionId: string) {
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
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<AlertEventType | null>(
    null
  );
  const [uploadingSound, setUploadingSound] = useState<AlertEventType | null>(
    null
  );

  // Load alert configurations
  useEffect(() => {
    const loadAlerts = async () => {
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
    };

    loadAlerts();
  }, [sessionId]);

  const updateConfig = useCallback(
    (eventType: AlertEventType, updates: Partial<AlertConfig>) => {
      setAlertConfigs(prev => ({
        ...prev,
        [eventType]: { ...prev[eventType], ...updates },
      }));
    },
    []
  );

  // Helper to save a single alert config
  const saveAlertConfig = useCallback(
    async (
      eventType: AlertEventType,
      additionalUpdates?: Partial<AlertConfig>
    ) => {
      try {
        const config = { ...alertConfigs[eventType], ...additionalUpdates };

        const payload = {
          sessionId,
          eventType,
          enabled: config.enabled ?? false,
          imageUrl: config.imageUrl || null,
          imagePublicId: config.imagePublicId || null,
          animationType: config.animationType || 'slide-down',
          duration: config.duration ?? 5,
          position: config.position || 'top-center',
          soundUrl: config.soundUrl || null,
          soundPublicId: config.soundPublicId || null,
          volume: config.volume ?? 0.7,
          messageTemplate:
            config.messageTemplate ||
            DEFAULT_MESSAGES[eventType as AlertEventType],
          fontSize: config.fontSize ?? 32,
          textColor: config.textColor || '#FFFFFF',
          textShadow: config.textShadow ?? true,
        };

        const response = await fetch('/api/alerts/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Failed to save ${eventType} alert`);
        }
      } catch (error) {
        console.error('Error saving alert config:', error);
        throw error;
      }
    },
    [sessionId, alertConfigs]
  );

  const handleImageUpload = useCallback(
    async (eventType: AlertEventType, file: File) => {
      setUploadingImage(eventType);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/alerts/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { imageUrl, publicId } = await response.json();
          updateConfig(eventType, { imageUrl, imagePublicId: publicId });

          // Auto-save after upload
          await saveAlertConfig(eventType, {
            imageUrl,
            imagePublicId: publicId,
          });
        } else {
          const { error } = await response.json();
          alert(`Error uploading image: ${error}`);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image');
      } finally {
        setUploadingImage(null);
      }
    },
    [updateConfig, saveAlertConfig]
  );

  const handleSoundUpload = useCallback(
    async (eventType: AlertEventType, file: File) => {
      setUploadingSound(eventType);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/alerts/upload-sound', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const { soundUrl, publicId } = await response.json();
          updateConfig(eventType, { soundUrl, soundPublicId: publicId });

          // Auto-save after upload
          await saveAlertConfig(eventType, {
            soundUrl,
            soundPublicId: publicId,
          });
        } else {
          const { error } = await response.json();
          alert(`Error uploading sound: ${error}`);
        }
      } catch (error) {
        console.error('Error uploading sound:', error);
        alert('Failed to upload sound');
      } finally {
        setUploadingSound(null);
      }
    },
    [updateConfig, saveAlertConfig]
  );

  const handleSaveAll = useCallback(async () => {
    setSaving(true);
    try {
      const savePromises = Object.entries(alertConfigs).map(
        async ([eventType, config]) => {
          // Only save if config has been modified (has at least one property)
          if (Object.keys(config).length === 0) return;
          await saveAlertConfig(eventType as AlertEventType);
        }
      );

      await Promise.all(savePromises);
      alert('Alert configurations saved successfully!');
    } catch (error) {
      console.error('Error saving alerts:', error);
      alert('Failed to save alert configurations');
    } finally {
      setSaving(false);
    }
  }, [alertConfigs, saveAlertConfig]);

  const handleTest = useCallback(
    async (eventType: AlertEventType) => {
      try {
        // Save the current config before testing
        await saveAlertConfig(eventType);

        const testData: {
          sessionId: string;
          eventType: AlertEventType;
          username?: string;
          amount?: number;
          count?: number;
          tier?: number;
        } = {
          sessionId,
          eventType,
          username: 'TestUser',
        };

        // Add event-specific test data
        if (eventType === 'bits') testData.amount = 100;
        if (eventType === 'raid') testData.count = 50;
        if (eventType === 'sub') testData.tier = 1;

        const response = await fetch('/api/alerts/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData),
        });

        if (!response.ok) {
          throw new Error('Failed to trigger test alert');
        }
      } catch (error) {
        console.error('Error testing alert:', error);
        alert('Failed to trigger test alert');
      }
    },
    [sessionId, saveAlertConfig]
  );

  const handleDeleteMedia = useCallback(
    async (eventType: AlertEventType, mediaType: 'image' | 'sound') => {
      const updates =
        mediaType === 'image'
          ? { imageUrl: undefined, imagePublicId: undefined }
          : { soundUrl: undefined, soundPublicId: undefined };

      updateConfig(eventType, updates);
      await saveAlertConfig(eventType, updates);
    },
    [updateConfig, saveAlertConfig]
  );

  return {
    alertConfigs,
    loading,
    saving,
    uploadingImage,
    uploadingSound,
    updateConfig,
    saveAlertConfig,
    handleImageUpload,
    handleSoundUpload,
    handleSaveAll,
    handleTest,
    handleDeleteMedia,
  };
}
