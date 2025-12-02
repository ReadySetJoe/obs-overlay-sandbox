// components/dashboard/expanded/AlertsExpanded.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  AlertConfig,
  AlertEventType,
  AlertAnimationType,
  AlertPosition,
} from '@/types/overlay';
import CopyURLButton from '../CopyURLButton';
import { AlertsIcon } from '../tiles/TileIcons';
import { useOverlayUrl } from '@/hooks/useOriginUrl';
import Image from 'next/image';

interface AlertsExpandedProps {
  sessionId: string;
  onClose: () => void;
  onAlertsSaved?: () => void;
}

const ALERT_TYPES: {
  type: AlertEventType;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    type: 'follow',
    label: 'New Follower',
    icon: '❤️',
    description: 'When someone follows your channel',
  },
  {
    type: 'sub',
    label: 'New Subscriber',
    icon: '⭐',
    description: 'When someone subscribes to your channel',
  },
  {
    type: 'bits',
    label: 'Bits Cheered',
    icon: '💎',
    description: 'When someone cheers with bits',
  },
  {
    type: 'raid',
    label: 'Raid',
    icon: '🎉',
    description: 'When another streamer raids your channel',
  },
  {
    type: 'giftsub',
    label: 'Gift Sub',
    icon: '🎁',
    description: 'When someone gifts a subscription',
  },
];

const ANIMATION_TYPES: { value: AlertAnimationType; label: string }[] = [
  { value: 'slide-down', label: 'Slide Down' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'bounce', label: 'Bounce' },
  { value: 'fade', label: 'Fade' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'spin', label: '🌀 Spin' },
  { value: 'wiggle', label: '🤪 Wiggle' },
  { value: 'flip', label: '🔄 Flip' },
  { value: 'rubber-band', label: '🎸 Rubber Band' },
  { value: 'swing', label: '🎪 Swing' },
  { value: 'tada', label: '🎉 Tada!' },
];

const POSITIONS: { value: AlertPosition; label: string }[] = [
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-right', label: 'Top Right' },
  { value: 'center', label: 'Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const DEFAULT_MESSAGES: Record<AlertEventType, string> = {
  follow: '{username} just followed!',
  sub: '{username} just subscribed!',
  bits: '{username} cheered {amount} bits!',
  raid: '{username} is raiding with {count} viewers!',
  giftsub: '{username} gifted a sub!',
};

export default function AlertsExpanded({
  sessionId,
  onClose,
  onAlertsSaved,
}: AlertsExpandedProps) {
  const overlayUrl = useOverlayUrl(sessionId, 'alerts');
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
  const [uploadingImage, setUploadingImage] = useState<AlertEventType | null>(
    null
  );
  const [uploadingSound, setUploadingSound] = useState<AlertEventType | null>(
    null
  );
  const [autoSaving, setAutoSaving] = useState(false);

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

  const updateConfig = (
    eventType: AlertEventType,
    updates: Partial<AlertConfig>
  ) => {
    setAlertConfigs(prev => ({
      ...prev,
      [eventType]: { ...prev[eventType], ...updates },
    }));
  };

  // Auto-save when configs change (debounced)
  useEffect(() => {
    // Don't auto-save on initial load
    if (loading) return;

    // Don't auto-save if no configs have been modified
    const hasModifications = Object.values(alertConfigs).some(
      config => Object.keys(config).length > 0
    );
    if (!hasModifications) return;

    setAutoSaving(true);
    const timer = setTimeout(async () => {
      try {
        const savePromises = Object.entries(alertConfigs).map(
          async ([eventType, config]) => {
            // Only save if config has been modified (has at least one property)
            if (Object.keys(config).length === 0) return;

            await saveAlertConfig(eventType as AlertEventType);
          }
        );

        await Promise.all(savePromises);
        onAlertsSaved?.();
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        setAutoSaving(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [alertConfigs, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper to save a single alert config
  const saveAlertConfig = async (
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
        showBackground: config.showBackground ?? true,
      };

      const response = await fetch('/api/alerts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to save ${eventType} alert`);
      }

      // Notify parent to refresh counts
      onAlertsSaved?.();
    } catch (error) {
      console.error('Error saving alert config:', error);
      throw error;
    }
  };

  const handleImageUpload = async (eventType: AlertEventType, file: File) => {
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
        await saveAlertConfig(eventType, { imageUrl, imagePublicId: publicId });
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
  };

  const handleSoundUpload = async (eventType: AlertEventType, file: File) => {
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
        await saveAlertConfig(eventType, { soundUrl, soundPublicId: publicId });
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
  };

  const handleTest = async (eventType: AlertEventType) => {
    try {
      // Save the current config before testing
      await saveAlertConfig(eventType);

      const testData: {
        sessionId: string;
        eventType: AlertEventType;
        username: string;
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger test alert');
      }

      // Show success message
      const successMessage = document.createElement('div');
      successMessage.className =
        'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      successMessage.textContent = 'Test alert sent successfully!';
      document.body.appendChild(successMessage);
      setTimeout(() => successMessage.remove(), 3000);
    } catch (error) {
      console.error('Error testing alert:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to trigger test alert';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className='bg-gray-900 text-white min-h-screen p-8'>
        <div className='flex items-center justify-center h-64'>
          <div className='w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin' />
        </div>
      </div>
    );
  }

  return (
    <div className='bg-gray-900 text-white min-h-screen p-8'>
      {/* Header */}
      <div className='flex items-center gap-4 mb-8'>
        <button
          onClick={onClose}
          className='p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors'
        >
          <svg
            className='w-6 h-6'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M15 19l-7-7 7-7'
            />
          </svg>
        </button>
        <div className='flex items-center gap-3'>
          <AlertsIcon size='lg' />
          <div>
            <h1 className='text-3xl font-bold'>Stream Alerts</h1>
            <p className='text-gray-400'>Configure alerts for Twitch events</p>
          </div>
        </div>
        {/* Auto-save indicator */}
        <div className='ml-auto'>
          {autoSaving ? (
            <div className='flex items-center gap-2 text-yellow-500'>
              <div className='w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin' />
              <span className='text-sm font-medium'>Saving...</span>
            </div>
          ) : (
            <div className='flex items-center gap-2 text-green-500'>
              <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-sm font-medium'>Saved</span>
            </div>
          )}
        </div>
      </div>

      {/* Alert Type Sections */}
      <div className='space-y-6 mb-8'>
        {ALERT_TYPES.map(({ type, label, icon, description }) => {
          const config = alertConfigs[type];
          // If config exists in DB (has an id), use its enabled value
          // If config has been modified locally (has enabled property), use that
          // Otherwise default to false for brand new unconfigured alerts
          const hasBeenModified = 'enabled' in config;
          const isConfigured = config.id !== undefined;
          const enabled =
            hasBeenModified || isConfigured ? (config.enabled ?? false) : false;

          return (
            <div key={type} className='bg-gray-800 rounded-lg p-6 space-y-4'>
              {/* Header */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>{icon}</span>
                  <div>
                    <h3 className='text-xl font-bold'>{label}</h3>
                    <p className='text-sm text-gray-400'>{description}</p>
                  </div>
                </div>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <span className='text-sm text-gray-400'>Enabled</span>
                  <input
                    type='checkbox'
                    checked={enabled}
                    onChange={e =>
                      updateConfig(type, { enabled: e.target.checked })
                    }
                    className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
                  />
                </label>
              </div>

              {enabled && (
                <div className='grid grid-cols-2 gap-6 pt-4 border-t border-gray-700'>
                  {/* Left Column */}
                  <div className='space-y-4'>
                    {/* Image Upload */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Alert Image/GIF
                      </label>
                      {config.imageUrl ? (
                        <div className='relative'>
                          <div className='w-full max-h-48 flex items-center justify-center bg-gray-700 rounded-lg overflow-hidden'>
                            <Image
                              src={config.imageUrl}
                              alt='Alert'
                              width={200}
                              height={200}
                              className='rounded-lg'
                            />
                          </div>
                          <button
                            onClick={async () => {
                              updateConfig(type, {
                                imageUrl: undefined,
                                imagePublicId: undefined,
                              });
                              await saveAlertConfig(type, {
                                imageUrl: undefined,
                                imagePublicId: undefined,
                              });
                            }}
                            className='absolute top-2 right-2 p-1 bg-red-600 rounded-lg hover:bg-red-700 transition-colors'
                          >
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className='block w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors'>
                          {uploadingImage === type ? (
                            <div className='flex items-center justify-center gap-2'>
                              <div className='w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className='text-2xl mb-2'>📷</div>
                              <div className='text-sm text-gray-400'>
                                Click to upload image or GIF
                              </div>
                              <div className='text-xs text-gray-500 mt-1'>
                                Max 5MB • JPG, PNG, GIF, WebP
                              </div>
                            </>
                          )}
                          <input
                            type='file'
                            accept='image/jpeg,image/jpg,image/png,image/gif,image/webp'
                            onChange={e =>
                              e.target.files?.[0] &&
                              handleImageUpload(type, e.target.files[0])
                            }
                            className='hidden'
                            disabled={uploadingImage === type}
                          />
                        </label>
                      )}
                    </div>

                    {/* Sound Upload */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Alert Sound
                      </label>
                      {config.soundUrl ? (
                        <div className='flex items-center gap-2'>
                          <audio
                            controls
                            src={config.soundUrl}
                            className='flex-1'
                          />
                          <button
                            onClick={async () => {
                              updateConfig(type, {
                                soundUrl: undefined,
                                soundPublicId: undefined,
                              });
                              await saveAlertConfig(type, {
                                soundUrl: undefined,
                                soundPublicId: undefined,
                              });
                            }}
                            className='p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-colors'
                          >
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <label className='block w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors'>
                          {uploadingSound === type ? (
                            <div className='flex items-center justify-center gap-2'>
                              <div className='w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin' />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <div className='text-2xl mb-2'>🔊</div>
                              <div className='text-sm text-gray-400'>
                                Click to upload sound
                              </div>
                              <div className='text-xs text-gray-500 mt-1'>
                                Max 5MB • MP3, WAV, OGG
                              </div>
                            </>
                          )}
                          <input
                            type='file'
                            accept='audio/mpeg,audio/mp3,audio/wav,audio/ogg'
                            onChange={e =>
                              e.target.files?.[0] &&
                              handleSoundUpload(type, e.target.files[0])
                            }
                            className='hidden'
                            disabled={uploadingSound === type}
                          />
                        </label>
                      )}
                    </div>

                    {/* Volume */}
                    {config.soundUrl && (
                      <div>
                        <label className='block text-sm font-semibold mb-2'>
                          Volume: {Math.round((config.volume ?? 0.7) * 100)}%
                        </label>
                        <input
                          type='range'
                          min='0'
                          max='1'
                          step='0.05'
                          value={config.volume ?? 0.7}
                          onChange={e =>
                            updateConfig(type, {
                              volume: parseFloat(e.target.value),
                            })
                          }
                          className='w-full'
                        />
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className='space-y-4'>
                    {/* Message Template */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Message Template
                      </label>
                      <input
                        type='text'
                        value={config.messageTemplate || DEFAULT_MESSAGES[type]}
                        onChange={e =>
                          updateConfig(type, {
                            messageTemplate: e.target.value,
                          })
                        }
                        className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500'
                        placeholder={DEFAULT_MESSAGES[type]}
                      />
                      <div className='mt-2 text-xs text-gray-400 space-y-1'>
                        <div>Available variables:</div>
                        <div className='flex flex-wrap gap-2'>
                          <code className='px-2 py-1 bg-gray-700 rounded'>
                            {'{username}'}
                          </code>
                          <code className='px-2 py-1 bg-gray-700 rounded'>
                            {'{event}'}
                          </code>
                          {type === 'bits' && (
                            <code className='px-2 py-1 bg-gray-700 rounded'>
                              {'{amount}'}
                            </code>
                          )}
                          {type === 'raid' && (
                            <code className='px-2 py-1 bg-gray-700 rounded'>
                              {'{count}'}
                            </code>
                          )}
                          {(type === 'sub' || type === 'giftsub') && (
                            <code className='px-2 py-1 bg-gray-700 rounded'>
                              {'{tier}'}
                            </code>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Animation Type */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Animation
                      </label>
                      <select
                        value={config.animationType || 'slide-down'}
                        onChange={e =>
                          updateConfig(type, {
                            animationType: e.target.value as AlertAnimationType,
                          })
                        }
                        className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500'
                      >
                        {ANIMATION_TYPES.map(anim => (
                          <option key={anim.value} value={anim.value}>
                            {anim.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Position */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Position
                      </label>
                      <select
                        value={config.position || 'top-center'}
                        onChange={e =>
                          updateConfig(type, {
                            position: e.target.value as AlertPosition,
                          })
                        }
                        className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500'
                      >
                        {POSITIONS.map(pos => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Duration: {config.duration ?? 5} seconds
                      </label>
                      <input
                        type='range'
                        min='2'
                        max='15'
                        step='1'
                        value={config.duration ?? 5}
                        onChange={e =>
                          updateConfig(type, {
                            duration: parseInt(e.target.value),
                          })
                        }
                        className='w-full'
                      />
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Font Size: {config.fontSize ?? 32}px
                      </label>
                      <input
                        type='range'
                        min='16'
                        max='72'
                        step='2'
                        value={config.fontSize ?? 32}
                        onChange={e =>
                          updateConfig(type, {
                            fontSize: parseInt(e.target.value),
                          })
                        }
                        className='w-full'
                      />
                    </div>

                    {/* Text Color */}
                    <div>
                      <label className='block text-sm font-semibold mb-2'>
                        Text Color
                      </label>
                      <div className='flex gap-2'>
                        <input
                          type='color'
                          value={config.textColor || '#FFFFFF'}
                          onChange={e =>
                            updateConfig(type, { textColor: e.target.value })
                          }
                          className='w-12 h-10 rounded cursor-pointer'
                        />
                        <input
                          type='text'
                          value={config.textColor || '#FFFFFF'}
                          onChange={e =>
                            updateConfig(type, { textColor: e.target.value })
                          }
                          className='flex-1 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500'
                        />
                      </div>
                    </div>

                    {/* Text Shadow */}
                    <div>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={config.textShadow ?? true}
                          onChange={e =>
                            updateConfig(type, { textShadow: e.target.checked })
                          }
                          className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
                        />
                        <span className='text-sm font-semibold'>
                          Enable Text Shadow
                        </span>
                      </label>
                    </div>

                    {/* Show Background */}
                    <div>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={config.showBackground ?? true}
                          onChange={e =>
                            updateConfig(type, {
                              showBackground: e.target.checked,
                            })
                          }
                          className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
                        />
                        <span className='text-sm font-semibold'>
                          Show Background Box
                        </span>
                      </label>
                      <p className='text-xs text-gray-400 mt-1'>
                        Uncheck for transparent, floating alert style
                      </p>
                    </div>

                    {/* Test Button */}
                    <button
                      onClick={() => handleTest(type)}
                      className='w-full py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-semibold'
                    >
                      Test {label}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className='mt-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg'>
        <h4 className='font-semibold mb-2'>💡 How to Use Alerts</h4>
        <ol className='text-sm text-gray-300 space-y-1 list-decimal list-inside'>
          <li>
            Configure each alert type with custom images, sounds, and messages
          </li>
          <li>Changes are automatically saved after 1 second of inactivity</li>
          <li>Use the Test button to preview how each alert will appear</li>
          <li>Add the Alerts overlay to OBS from the dashboard</li>
          <li>
            Alerts will trigger automatically when configured Twitch events
            occur
          </li>
        </ol>
      </div>

      {/* Copy URL */}
      <div className='mb-6 space-y-3'>
        <CopyURLButton
          url={overlayUrl}
          label='Alerts Overlay URL'
        />
        <p className='text-xs text-gray-400 mt-2'>
          Individual overlay showing only alerts
        </p>
      </div>
    </div>
  );
}
