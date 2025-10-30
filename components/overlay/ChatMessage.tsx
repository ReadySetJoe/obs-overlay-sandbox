// components/overlay/ChatMessage.tsx
'use client';

import { useEffect, useState } from 'react';
import { ChatMessage as ChatMessageType } from '@/types/overlay';

interface ChatMessageProps {
  message: ChatMessageType;
  onComplete: () => void;
}

const roleStyles: Record<ChatMessageType['role'], string> = {
  viewer: 'bg-gray-800/90 border-gray-600',
  subscriber: 'bg-purple-900/90 border-purple-500',
  moderator: 'bg-green-900/90 border-green-500',
  vip: 'bg-pink-900/90 border-pink-500',
  'first-timer': 'bg-blue-900/90 border-blue-400 animate-pulse',
};

const roleIcons: Record<ChatMessageType['role'], string> = {
  viewer: '💬',
  subscriber: '⭐',
  moderator: '🛡️',
  vip: '💎',
  'first-timer': '🎉',
};

export default function ChatMessage({ message, onComplete }: ChatMessageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Slide in animation
    setTimeout(() => setIsVisible(true), 50);

    // Auto-remove after 8 seconds
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(onComplete, 500);
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`
        transform transition-all duration-500 mb-3
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isLeaving ? '-translate-x-full opacity-0' : ''}
      `}
    >
      <div
        className={`
          ${roleStyles[message.role]}
          border-l-4 rounded-lg p-4 shadow-2xl
          backdrop-blur-sm max-w-md
        `}
      >
        <div className='flex items-start gap-3'>
          <span className='text-2xl flex-shrink-0'>
            {roleIcons[message.role]}
          </span>
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 mb-1'>
              <span
                className='font-bold text-sm'
                style={{ color: message.color || '#ffffff' }}
              >
                {message.username}
              </span>
              <span className='text-xs text-gray-400 uppercase tracking-wider'>
                {message.role}
              </span>
            </div>
            <p className='text-white text-base leading-relaxed break-words'>
              {message.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
