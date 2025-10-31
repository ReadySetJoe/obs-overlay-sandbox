// components/overlay/ChatHighlight.tsx
'use client';

import {
  ChatHighlight as ChatHighlightType,
  ChatHighlightLayout,
} from '@/types/overlay';

interface ChatHighlightProps {
  highlight: ChatHighlightType | null;
  layout: ChatHighlightLayout;
}

const roleStyles: Record<string, string> = {
  viewer: 'bg-gradient-to-br from-gray-900/95 to-black/95 border-gray-600',
  subscriber:
    'bg-gradient-to-br from-purple-950/95 to-purple-900/95 border-purple-500',
  moderator:
    'bg-gradient-to-br from-gray-900/95 to-black/95 border-emerald-500',
  vip: 'bg-gradient-to-br from-pink-950/95 to-pink-900/95 border-pink-500',
  'first-timer':
    'bg-gradient-to-br from-blue-950/95 to-blue-900/95 border-blue-500',
};

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
}: ChatHighlightProps) {
  if (!highlight) return null;

  // Don't render if layout is not properly initialized (prevents flash at top-left)
  if (!layout || layout.x === undefined || layout.y === undefined) {
    return null;
  }

  const { message } = highlight;

  const positionClasses: Record<string, string> = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    custom: 'top-0 left-0',
  };

  return (
    <div
      className={`absolute ${positionClasses[layout.position]} p-6`}
      style={{
        transform: `translate(${layout.x}px, ${layout.y}px) scale(${layout.scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div className='animate-slide-in-bounce w-full h-full'>
        <div
          className={`
          ${roleStyles[message.role]}
          border-l-4 rounded-2xl p-6 shadow-2xl
          backdrop-blur-md
          relative overflow-hidden
        `}
          style={{ width: `${layout.width}px` }}
        >
          {/* Subtle shine animation */}
          <div className='absolute inset-0 shine-effect pointer-events-none' />

          <div className='flex items-start gap-4 relative z-10'>
            <div className='flex-shrink-0'>
              <div className='text-4xl mb-2 animate-bounce-gentle'>
                {roleIcons[message.role]}
              </div>
              <div className='text-xs text-yellow-400 uppercase tracking-wider font-bold flex items-center gap-1'>
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
