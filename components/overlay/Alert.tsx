// components/overlay/Alert.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { AlertConfig, AlertEvent, ColorScheme, CustomColors } from '@/types/overlay';
import { useThemeColors, hexToRgba } from '@/hooks/useThemeColors';

interface AlertProps {
  config: AlertConfig;
  event: AlertEvent;
  onComplete: () => void;
  colorScheme?: ColorScheme;
  customColors?: CustomColors | null;
}

export default function Alert({ config, event, onComplete, colorScheme = 'default', customColors = null }: AlertProps) {
  const theme = useThemeColors(colorScheme, customColors);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Play sound if configured (only once)
    if (config.soundUrl && audioRef.current && !hasPlayedRef.current) {
      audioRef.current.volume = config.volume;
      audioRef.current.play().catch(err => console.error('Error playing alert sound:', err));
      hasPlayedRef.current = true;
    }

    // Show alert
    const showTimer = setTimeout(() => setIsVisible(true), 50);

    // Hide after duration
    const hideTimer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onCompleteRef.current(), 500); // Allow exit animation
    }, config.duration * 1000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      // Stop audio if still playing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Replace template variables in message
  const formatMessage = (template: string): string => {
    return template
      .replace('{username}', event.username)
      .replace('{event}', getEventName(event.eventType))
      .replace('{amount}', event.amount?.toString() || '')
      .replace('{count}', event.count?.toString() || '')
      .replace('{tier}', event.tier ? `Tier ${event.tier}` : '');
  };

  const getEventName = (type: string): string => {
    switch (type) {
      case 'follow': return 'followed';
      case 'sub': return 'subscribed';
      case 'bits': return 'cheered';
      case 'raid': return 'raided';
      case 'giftsub': return 'gifted a sub';
      default: return type;
    }
  };

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-left': 'top-8 left-8',
    'top-center': 'top-8 left-1/2 -translate-x-1/2',
    'top-right': 'top-8 right-8',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-8 left-8',
    'bottom-center': 'bottom-8 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-8 right-8',
  };

  // Animation classes
  const getAnimationClasses = () => {
    const base = 'transition-all duration-500 ease-out';

    if (!isVisible) {
      switch (config.animationType) {
        case 'slide-down':
          return `${base} -translate-y-full opacity-0`;
        case 'slide-up':
          return `${base} translate-y-full opacity-0`;
        case 'bounce':
          return `${base} scale-0 opacity-0`;
        case 'fade':
          return `${base} opacity-0`;
        case 'zoom':
          return `${base} scale-0 opacity-0`;
        default:
          return `${base} opacity-0`;
      }
    }

    if (isLeaving) {
      switch (config.animationType) {
        case 'slide-down':
          return `${base} translate-y-full opacity-0`;
        case 'slide-up':
          return `${base} -translate-y-full opacity-0`;
        case 'bounce':
          return `${base} scale-0 opacity-0`;
        case 'fade':
          return `${base} opacity-0`;
        case 'zoom':
          return `${base} scale-150 opacity-0`;
        default:
          return `${base} opacity-0`;
      }
    }

    // Visible state
    switch (config.animationType) {
      case 'bounce':
        return `${base} animate-bounce-in`;
      default:
        return `${base} opacity-100 translate-y-0 scale-100`;
    }
  };

  return (
    <>
      {config.soundUrl && (
        <audio ref={audioRef} src={config.soundUrl} preload="auto" />
      )}

      <div
        className={`fixed ${positionClasses[config.position]} ${getAnimationClasses()} z-50`}
      >
        <div
          className="flex flex-col items-center gap-4 p-6 backdrop-blur-md rounded-2xl border-2 shadow-2xl"
          style={{
            background: `linear-gradient(to bottom right, ${hexToRgba(theme.primaryDark, 0.95)}, ${hexToRgba(theme.secondaryDark, 0.95)})`,
            borderColor: hexToRgba(theme.accent, 0.5),
            boxShadow: `0 20px 25px -5px ${hexToRgba(theme.accent, 0.3)}, 0 10px 10px -5px ${hexToRgba(theme.accent, 0.2)}`,
          }}
        >
          {/* Alert Image */}
          {config.imageUrl && (
            <img
              src={config.imageUrl}
              alt="Alert"
              className="max-w-xs max-h-48 object-contain rounded-lg"
            />
          )}

          {/* Alert Message */}
          <div
            className="font-bold text-center"
            style={{
              fontSize: `${config.fontSize}px`,
              color: config.textColor,
              textShadow: config.textShadow ? '0 4px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {formatMessage(config.messageTemplate)}
          </div>

          {/* Additional info for specific event types */}
          {event.eventType === 'bits' && event.amount && (
            <div className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.accentText }}>
              <span className="text-3xl">💎</span>
              {event.amount} Bits
            </div>
          )}

          {event.eventType === 'raid' && event.count && (
            <div className="text-xl font-bold" style={{ color: theme.accentText }}>
              with {event.count} viewers!
            </div>
          )}

          {event.eventType === 'sub' && event.tier && (
            <div className="text-xl font-bold" style={{ color: theme.accentText }}>
              Tier {event.tier} ⭐
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
