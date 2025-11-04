// components/overlay/Alert.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  AlertConfig,
  AlertEvent,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import { useThemeColors, hexToRgba } from '@/hooks/useThemeColors';
import Image from 'next/image';

interface AlertProps {
  config: AlertConfig;
  event: AlertEvent;
  onComplete: () => void;
  colorScheme?: ColorScheme;
  customColors?: CustomColors | null;
}

export default function Alert({
  config,
  event,
  onComplete,
  colorScheme = 'default',
  customColors = null,
}: AlertProps) {
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
    // Capture the current audio element reference
    const currentAudio = audioRef.current;

    // Play sound if configured (only once)
    if (config.soundUrl && currentAudio && !hasPlayedRef.current) {
      currentAudio.volume = config.volume;
      currentAudio
        .play()
        .catch(err => console.error('Error playing alert sound:', err));
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
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    };
  }, [config]); // Empty dependency array - only run once on mount

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
      case 'follow':
        return 'followed';
      case 'sub':
        return 'subscribed';
      case 'bits':
        return 'cheered';
      case 'raid':
        return 'raided';
      case 'giftsub':
        return 'gifted a sub';
      default:
        return type;
    }
  };

  // Position classes
  const positionClasses: Record<string, string> = {
    'top-left': 'top-8 left-8',
    'top-center': 'top-8 left-1/2 -translate-x-1/2',
    'top-right': 'top-8 right-8',
    center: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
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
        case 'wiggle':
        case 'rubber-band':
        case 'swing':
        case 'tada':
          return `${base} scale-0 opacity-0`;
        case 'spin':
          return `${base} rotate-180 scale-0 opacity-0`;
        case 'flip':
          return `${base} opacity-0`;
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
      case 'spin':
        return `${base} animate-spin-in`;
      case 'wiggle':
        return `${base} animate-wiggle`;
      case 'flip':
        return `${base} animate-flip-in`;
      case 'rubber-band':
        return `${base} animate-rubber-band`;
      case 'swing':
        return `${base} animate-swing`;
      case 'tada':
        return `${base} animate-tada`;
      default:
        return `${base} opacity-100 translate-y-0 scale-100`;
    }
  };

  return (
    <>
      {config.soundUrl && (
        <audio ref={audioRef} src={config.soundUrl} preload='auto' />
      )}

      <div
        className={`fixed ${positionClasses[config.position]} ${getAnimationClasses()} z-50`}
      >
        <div
          className={`flex flex-col items-center gap-4 ${
            config.showBackground
              ? 'p-6 backdrop-blur-md rounded-2xl border-2 shadow-2xl'
              : ''
          }`}
          style={
            config.showBackground
              ? {
                  background: `linear-gradient(to bottom right, ${hexToRgba(theme.primaryDark, 0.95)}, ${hexToRgba(theme.secondaryDark, 0.95)})`,
                  borderColor: hexToRgba(theme.accent, 0.5),
                  boxShadow: `0 20px 25px -5px ${hexToRgba(theme.accent, 0.3)}, 0 10px 10px -5px ${hexToRgba(theme.accent, 0.2)}`,
                }
              : {}
          }
        >
          {/* Alert Image */}
          {config.imageUrl && (
            <Image src={config.imageUrl} alt='Alert' width={200} height={200} />
          )}

          {/* Alert Message */}
          <div
            className='font-bold text-center'
            style={{
              fontSize: `${config.fontSize}px`,
              color: config.textColor,
              textShadow: config.textShadow
                ? '0 4px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)'
                : 'none',
            }}
          >
            {formatMessage(config.messageTemplate)}
          </div>

          {/* Additional info for specific event types */}
          {event.eventType === 'bits' && event.amount && (
            <div
              className='text-2xl font-bold flex items-center gap-2'
              style={{ color: theme.accentText }}
            >
              <span className='text-3xl'>💎</span>
              {event.amount} Bits
            </div>
          )}

          {event.eventType === 'raid' && event.count && (
            <div
              className='text-xl font-bold'
              style={{ color: theme.accentText }}
            >
              with {event.count} viewers!
            </div>
          )}

          {event.eventType === 'sub' && event.tier && (
            <div
              className='text-xl font-bold'
              style={{ color: theme.accentText }}
            >
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

        @keyframes spin-in {
          0% {
            transform: rotate(0deg) scale(0);
            opacity: 0;
          }
          100% {
            transform: rotate(360deg) scale(1);
            opacity: 1;
          }
        }

        @keyframes wiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: rotate(-10deg);
          }
          20%,
          40%,
          60%,
          80% {
            transform: rotate(10deg);
          }
        }

        @keyframes flip-in {
          0% {
            transform: perspective(400px) rotateY(-90deg);
            opacity: 0;
          }
          40% {
            transform: perspective(400px) rotateY(20deg);
          }
          60% {
            transform: perspective(400px) rotateY(-10deg);
          }
          100% {
            transform: perspective(400px) rotateY(0deg);
            opacity: 1;
          }
        }

        @keyframes rubber-band {
          0% {
            transform: scale3d(1, 1, 1);
          }
          30% {
            transform: scale3d(1.25, 0.75, 1);
          }
          40% {
            transform: scale3d(0.75, 1.25, 1);
          }
          50% {
            transform: scale3d(1.15, 0.85, 1);
          }
          65% {
            transform: scale3d(0.95, 1.05, 1);
          }
          75% {
            transform: scale3d(1.05, 0.95, 1);
          }
          100% {
            transform: scale3d(1, 1, 1);
          }
        }

        @keyframes swing {
          20% {
            transform: rotate(15deg);
          }
          40% {
            transform: rotate(-10deg);
          }
          60% {
            transform: rotate(5deg);
          }
          80% {
            transform: rotate(-5deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        @keyframes tada {
          0% {
            transform: scale(1) rotate(0deg);
          }
          10%,
          20% {
            transform: scale(0.9) rotate(-3deg);
          }
          30%,
          50%,
          70%,
          90% {
            transform: scale(1.1) rotate(3deg);
          }
          40%,
          60%,
          80% {
            transform: scale(1.1) rotate(-3deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out;
        }

        .animate-spin-in {
          animation: spin-in 0.6s ease-out;
        }

        .animate-wiggle {
          animation: wiggle 0.8s ease-in-out;
        }

        .animate-flip-in {
          animation: flip-in 0.6s ease-out;
        }

        .animate-rubber-band {
          animation: rubber-band 0.8s ease-in-out;
        }

        .animate-swing {
          animation: swing 0.8s ease-in-out;
          transform-origin: top center;
        }

        .animate-tada {
          animation: tada 1s ease-in-out;
        }
      `}</style>
    </>
  );
}
