// components/dashboard/expanded/ChatHighlightExpanded.tsx
'use client';

import { useState } from 'react';
import { ChatMessage, ComponentLayouts, ChatHighlight } from '@/types/overlay';
import PositionControls from '../PositionControls';
import CopyURLButton from '../CopyURLButton';
import { ChatHighlightIcon } from '../tiles/TileIcons';
import { useOverlayUrl } from '@/hooks/useOriginUrl';

interface ChatHighlightExpandedProps {
  sessionId: string;
  messages: ChatMessage[];
  currentHighlight: ChatHighlight | null;
  isVisible: boolean;
  isAuthenticated: boolean;
  twitchUsername: string | null;
  componentLayouts: ComponentLayouts;
  onHighlightMessage: (message: ChatMessage) => void;
  onClearHighlight: () => void;
  onToggleVisibility: () => void;
  onPositionChange: (x: number, y: number) => void;
  onWidthChange: (width: number) => void;
  onScaleChange: (scale: number) => void;
  onClose: () => void;
}

const roleStyles: Record<string, string> = {
  viewer: 'bg-linear-to-br from-gray-900/95 to-black/95 border-gray-600',
  subscriber:
    'bg-linear-to-br from-purple-950/95 to-purple-900/95 border-purple-500',
  moderator: 'bg-linear-to-br from-gray-900/95 to-black/95 border-emerald-500',
  vip: 'bg-linear-to-br from-pink-950/95 to-pink-900/95 border-pink-500',
  'first-timer':
    'bg-linear-to-br from-blue-950/95 to-blue-900/95 border-blue-500',
};

const roleIcons: Record<string, string> = {
  viewer: '💬',
  subscriber: '⭐',
  moderator: '🛡️',
  vip: '💎',
  'first-timer': '🎉',
};

export default function ChatHighlightExpanded({
  sessionId,
  messages,
  currentHighlight,
  isVisible,
  isAuthenticated,
  twitchUsername,
  componentLayouts,
  onHighlightMessage,
  onClearHighlight,
  onToggleVisibility,
  onPositionChange,
  onWidthChange,
  onScaleChange,
  onClose,
}: ChatHighlightExpandedProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMessages = messages.filter(
    msg =>
      msg.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentMessages = filteredMessages.slice(-50).reverse();

  return (
    <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <button
            onClick={onClose}
            className='w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white'
            aria-label='Back'
          >
            <svg
              className='w-5 h-5'
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
          <ChatHighlightIcon />
          <h2 className='text-xl font-bold'>Chat Highlight</h2>
        </div>
        <button
          onClick={onToggleVisibility}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isVisible
              ? 'bg-yellow-600 hover:bg-yellow-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVisible ? '👁️ Visible' : '🚫 Hidden'}
        </button>
      </div>

      {/* Authentication Required */}
      {!isAuthenticated ? (
        <div className='text-center py-12'>
          <div className='mb-4 text-6xl'>🎮</div>
          <div className='mb-4 text-gray-300 text-lg'>
            Connect your Twitch account to highlight chat messages
          </div>
          <button
            onClick={() => (window.location.href = '/api/auth/signin')}
            className='inline-block bg-linear-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 rounded-xl px-8 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer'
          >
            Connect with Twitch
          </button>
        </div>
      ) : (
        <>
          {/* Twitch Connection Status */}
          <div className='mb-4 bg-linear-to-r from-purple-900/30 to-purple-800/30 rounded-xl p-4 border border-purple-500/30'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center'>
                <svg
                  className='w-6 h-6'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' />
                </svg>
              </div>
              <div className='flex-1'>
                <div className='text-sm font-semibold text-purple-300'>
                  Connected as {twitchUsername || 'Twitch User'}
                </div>
                <div className='text-xs text-gray-400'>
                  Chat messages from your channel will appear below
                </div>
              </div>
            </div>
          </div>

          {/* Current Highlight */}
          {currentHighlight && (
            <div className='mb-6 bg-linear-to-br from-yellow-900/30 to-amber-900/30 rounded-xl p-4 border border-yellow-500/50'>
              <div className='flex items-center justify-between mb-3'>
                <div className='text-sm font-semibold text-yellow-400'>
                  Currently Highlighted
                </div>
                <button
                  onClick={onClearHighlight}
                  className='text-xs text-red-400 hover:text-red-300 transition'
                >
                  Clear
                </button>
              </div>
              <div
                className={`${roleStyles[currentHighlight.message.role]} border-l-4 rounded-lg p-3`}
              >
                <div className='flex items-start gap-3'>
                  <span className='text-xl'>
                    {roleIcons[currentHighlight.message.role]}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                      <span
                        className='font-bold text-sm'
                        style={{
                          color: currentHighlight.message.color || '#ffffff',
                        }}
                      >
                        {currentHighlight.message.username}
                      </span>
                      <span className='text-xs text-gray-400 uppercase'>
                        {currentHighlight.message.role}
                      </span>
                    </div>
                    <p className='text-white text-sm'>
                      {currentHighlight.message.message}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className='mb-4'>
            <div className='relative'>
              <svg
                className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </svg>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className='w-full bg-gray-700/50 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                placeholder='Search messages or username...'
              />
            </div>
          </div>

          {/* Recent Messages */}
          <div className='mb-6'>
            <div className='text-xs text-gray-400 mb-2'>
              {recentMessages.length} message
              {recentMessages.length !== 1 ? 's' : ''}
            </div>
            <div className='space-y-2 max-h-96 overflow-y-auto custom-scrollbar'>
              {recentMessages.length === 0 ? (
                <div className='text-center py-8 text-gray-500 text-sm'>
                  {searchQuery ? 'No messages found' : 'No chat messages yet'}
                </div>
              ) : (
                recentMessages.map(message => (
                  <button
                    key={message.id}
                    onClick={() => onHighlightMessage(message)}
                    className={`
                  w-full text-left ${roleStyles[message.role]} border-l-4 rounded-lg p-3
                  transition-all duration-200 hover:bg-yellow-900/20 hover:border-yellow-500
                  ${currentHighlight?.message.id === message.id ? 'ring-2 ring-yellow-500' : ''}
                `}
                  >
                    <div className='flex items-start gap-3'>
                      <span className='text-lg shrink-0'>
                        {roleIcons[message.role]}
                      </span>
                      <div className='flex-1 min-w-0'>
                        <div className='flex items-center gap-2 mb-1'>
                          <span
                            className='font-bold text-xs'
                            style={{ color: message.color || '#ffffff' }}
                          >
                            {message.username}
                          </span>
                          <span className='text-xs text-gray-400 uppercase'>
                            {message.role}
                          </span>
                          <span className='text-xs text-gray-500 ml-auto'>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className='text-white text-sm wrap-break-word'>
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Position & Size Controls */}
          <div className='mt-6 pt-6 border-t border-gray-600'>
            <h4 className='text-sm font-semibold text-gray-300 mb-3'>
              Position & Size
            </h4>
            <PositionControls
              x={componentLayouts.chatHighlight?.x || 0}
              y={componentLayouts.chatHighlight?.y || 0}
              onPositionChange={onPositionChange}
              color='yellow'
              elementWidth={componentLayouts.chatHighlight?.width || 500}
              elementHeight={150}
              scale={componentLayouts.chatHighlight?.scale || 1}
            />
            <div className='grid grid-cols-2 gap-3 mt-3'>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Width: {componentLayouts.chatHighlight?.width || 500}px
                </label>
                <input
                  type='range'
                  min='400'
                  max='800'
                  step='50'
                  value={componentLayouts.chatHighlight?.width || 500}
                  onChange={e => onWidthChange(parseInt(e.target.value))}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Scale:{' '}
                  {(componentLayouts.chatHighlight?.scale || 1).toFixed(1)}x
                </label>
                <input
                  type='range'
                  min='0.5'
                  max='2'
                  step='0.1'
                  value={componentLayouts.chatHighlight?.scale || 1}
                  onChange={e => onScaleChange(parseFloat(e.target.value))}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
                />
              </div>
            </div>
          </div>

          {/* Copy URL for OBS */}
          <CopyURLButton url={useOverlayUrl(sessionId, 'chat-highlight')} />
        </>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(234, 179, 8, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(234, 179, 8, 0.7);
        }
      `}</style>
    </div>
  );
}
