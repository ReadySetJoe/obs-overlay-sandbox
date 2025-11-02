// components/overlay/ChatHighlight.tsx
'use client';

import {
  ChatHighlight as ChatHighlightType,
  ChatHighlightLayout,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import { useThemeColors, hexToRgba } from '@/hooks/useThemeColors';

interface ChatHighlightProps {
  highlight: ChatHighlightType | null;
  layout: ChatHighlightLayout;
  colorScheme: ColorScheme;
  customColors: CustomColors | null;
}

const roleIcons: Record<string, string> = {
  viewer: '💬',
  subscriber: '⭐',
  moderator: '🛡️',
  vip: '💎',
  'first-timer': '🎉',
};

export default function ChatHighlight({
  highlight,
  layout,
  colorScheme,
  customColors,
}: ChatHighlightProps) {
  // Get theme colors
  const theme = useThemeColors(colorScheme, customColors);

  if (!highlight) return null;

  // Don't render if layout is not properly initialized (prevents flash at top-left)
  if (!layout || layout.x === undefined || layout.y === undefined) {
    return null;
  }

  const { message } = highlight;

  // Generate role-specific styled using theme colors instead of hardcoded colors
  // Each role gets a variation of the theme to maintain differentiation
  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'subscriber':
        return {
          background: `linear-gradient(to bottom right, ${hexToRgba(theme.primary, 0.95)}, ${hexToRgba(theme.primaryDark, 0.95)})`,
          borderColor: theme.primaryText,
        };
      case 'moderator':
        return {
          background: `linear-gradient(to bottom right, ${hexToRgba(theme.secondary, 0.95)}, ${hexToRgba(theme.secondaryDark, 0.95)})`,
          borderColor: theme.secondaryText,
        };
      case 'vip':
        return {
          background: `linear-gradient(to bottom right, ${hexToRgba(theme.accent, 0.95)}, ${hexToRgba(theme.accentDark, 0.95)})`,
          borderColor: theme.accentText,
        };
      case 'first-timer':
        return {
          background: `linear-gradient(to bottom right, ${hexToRgba(theme.primaryLight, 0.95)}, ${hexToRgba(theme.primary, 0.95)})`,
          borderColor: theme.primaryText,
        };
      default: // viewer
        return {
          background: `linear-gradient(to bottom right, rgba(31, 41, 55, 0.95), rgba(0, 0, 0, 0.95))`,
          borderColor: theme.accentText,
        };
    }
  };

  const roleStyle = getRoleStyle(message.role);

  const positionClasses: Record<string, string> = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    custom: 'top-0 left-0',
  };

  return (
    <div
      className={`fixed ${positionClasses[layout.position]} transform transition-all duration-500 translate-y-0 opacity-100`}
      style={{
        zIndex: 10,
        width: `${layout.width}px`,
        transform: `translate(${layout.position.includes('right') ? '-' : ''}${layout.x}px, ${layout.position.includes('bottom') ? '-' : ''}${layout.y}px) scale(${layout.scale})`,
        padding: '2rem',
      }}
    >
      <div className='animate-slide-in-bounce w-full h-full'>
        <div
          className='border-l-4 rounded-2xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden'
          style={{
            width: `${layout.width}px`,
            background: roleStyle.background,
            borderColor: roleStyle.borderColor,
          }}
        >
          {/* Subtle shine animation */}
          <div className='absolute inset-0 shine-effect pointer-events-none' />

          <div className='flex items-start gap-4 relative z-10'>
            <div className='flex-shrink-0'>
              <div className='text-4xl mb-2 animate-bounce-gentle'>
                {roleIcons[message.role]}
              </div>
              <div
                className='text-xs uppercase tracking-wider font-bold flex items-center gap-1'
                style={{ color: theme.accentText }}
              >
                <svg
                  className='w-3 h-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                </svg>
                Highlighted
              </div>
            </div>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-2'>
                <span
                  className='font-bold text-lg animate-fade-in'
                  style={{ color: message.color || '#ffffff' }}
                >
                  {message.username}
                </span>
                <span className='text-xs text-gray-400 uppercase tracking-wider px-2 py-0.5 bg-gray-700/50 rounded'>
                  {message.role}
                </span>
              </div>
              <p className='text-white text-xl leading-relaxed break-words animate-fade-in-delay'>
                {message.message}
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInBounce {
          0% {
            opacity: 0;
            transform: translateY(30px);
          }
          60% {
            opacity: 1;
            transform: translateY(-5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shine {
          0% {
            transform: translateX(-100%) rotate(45deg);
          }
          100% {
            transform: translateX(200%) rotate(45deg);
          }
        }

        @keyframes bounceGentle {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-in-bounce {
          animation: slideInBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .shine-effect {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: shine 3s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-bounce-gentle {
          animation: bounceGentle 2s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out 0.2s both;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.5s ease-out 0.4s both;
        }
      `}</style>
    </div>
  );
}
