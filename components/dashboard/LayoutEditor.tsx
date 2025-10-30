// components/dashboard/LayoutEditor.tsx
'use client';

import { ComponentLayouts, Position } from '@/types/overlay';

interface LayoutEditorProps {
  componentLayouts: ComponentLayouts;
  onLayoutChange: (layouts: ComponentLayouts) => void;
}

export default function LayoutEditor({
  componentLayouts,
  onLayoutChange,
}: LayoutEditorProps) {
  const updateChatLayout = (key: keyof ComponentLayouts['chat'], value: any) => {
    onLayoutChange({
      ...componentLayouts,
      chat: { ...componentLayouts.chat, [key]: value },
    });
  };

  const updateNowPlayingLayout = (
    key: keyof ComponentLayouts['nowPlaying'],
    value: any
  ) => {
    onLayoutChange({
      ...componentLayouts,
      nowPlaying: { ...componentLayouts.nowPlaying, [key]: value },
    });
  };

  const updateCountdownLayout = (
    key: keyof ComponentLayouts['countdown'],
    value: any
  ) => {
    onLayoutChange({
      ...componentLayouts,
      countdown: { ...componentLayouts.countdown, [key]: value },
    });
  };

  const updateWeatherLayout = (
    key: keyof ComponentLayouts['weather'],
    value: any
  ) => {
    onLayoutChange({
      ...componentLayouts,
      weather: { ...componentLayouts.weather, [key]: value },
    });
  };

  const positionOptions: Position[] = [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ];

  return (
    <div className='space-y-6'>
      {/* Chat Messages Layout */}
      <div className='bg-gray-700/30 rounded-xl p-4 border border-gray-600'>
        <h4 className='font-semibold text-cyan-400 mb-4 flex items-center gap-2'>
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
              d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
          </svg>
          Chat Messages
        </h4>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs text-gray-400 mb-2'>
              Position
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {positionOptions.map(pos => (
                <button
                  key={pos}
                  onClick={() => updateChatLayout('position', pos)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition ${
                    componentLayouts.chat.position === pos
                      ? 'bg-cyan-600 border-cyan-500'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  } border`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                X Offset: {componentLayouts.chat.x || 0}px
              </label>
              <input
                type='range'
                min='0'
                max='200'
                value={componentLayouts.chat.x || 0}
                onChange={e =>
                  updateChatLayout('x', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Y Offset: {componentLayouts.chat.y || 0}px
              </label>
              <input
                type='range'
                min='0'
                max='200'
                value={componentLayouts.chat.y || 0}
                onChange={e =>
                  updateChatLayout('y', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500'
              />
            </div>
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Max Width: {componentLayouts.chat.maxWidth || 400}px
            </label>
            <input
              type='range'
              min='200'
              max='600'
              step='50'
              value={componentLayouts.chat.maxWidth || 400}
              onChange={e =>
                updateChatLayout('maxWidth', parseInt(e.target.value))
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500'
            />
          </div>
        </div>
      </div>

      {/* Now Playing Layout */}
      <div className='bg-gray-700/30 rounded-xl p-4 border border-gray-600'>
        <h4 className='font-semibold text-green-400 mb-4 flex items-center gap-2'>
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
              d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
            />
          </svg>
          Now Playing
        </h4>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs text-gray-400 mb-2'>
              Position
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {positionOptions.map(pos => (
                <button
                  key={pos}
                  onClick={() => updateNowPlayingLayout('position', pos)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition ${
                    componentLayouts.nowPlaying.position === pos
                      ? 'bg-green-600 border-green-500'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  } border`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                X Offset: {componentLayouts.nowPlaying.x || 0}px
              </label>
              <input
                type='range'
                min='0'
                max='200'
                value={componentLayouts.nowPlaying.x || 0}
                onChange={e =>
                  updateNowPlayingLayout('x', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Y Offset: {componentLayouts.nowPlaying.y || 0}px
              </label>
              <input
                type='range'
                min='0'
                max='200'
                value={componentLayouts.nowPlaying.y || 0}
                onChange={e =>
                  updateNowPlayingLayout('y', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Width: {componentLayouts.nowPlaying.width || 400}px
              </label>
              <input
                type='range'
                min='300'
                max='600'
                step='50'
                value={componentLayouts.nowPlaying.width || 400}
                onChange={e =>
                  updateNowPlayingLayout('width', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Scale: {(componentLayouts.nowPlaying.scale || 1).toFixed(1)}x
              </label>
              <input
                type='range'
                min='0.5'
                max='2'
                step='0.1'
                value={componentLayouts.nowPlaying.scale || 1}
                onChange={e =>
                  updateNowPlayingLayout('scale', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Timers Layout */}
      <div className='bg-gray-700/30 rounded-xl p-4 border border-gray-600'>
        <h4 className='font-semibold text-yellow-400 mb-4 flex items-center gap-2'>
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
              d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          Countdown Timers
        </h4>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs text-gray-400 mb-2'>
              Position
            </label>
            <div className='grid grid-cols-2 gap-2'>
              {positionOptions.map(pos => (
                <button
                  key={pos}
                  onClick={() => updateCountdownLayout('position', pos)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold capitalize transition ${
                    componentLayouts.countdown.position === pos
                      ? 'bg-yellow-600 border-yellow-500'
                      : 'bg-gray-800 border-gray-600 hover:bg-gray-700'
                  } border`}
                >
                  {pos.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                X Offset: {componentLayouts.countdown.x || 0}px
              </label>
              <input
                type='range'
                min='0'
                max='200'
                value={componentLayouts.countdown.x || 0}
                onChange={e =>
                  updateCountdownLayout('x', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Y Offset: {componentLayouts.countdown.y || 0}px
              </label>
              <input
                type='range'
                min='0'
                max='200'
                value={componentLayouts.countdown.y || 0}
                onChange={e =>
                  updateCountdownLayout('y', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
              />
            </div>
          </div>
          <div className='grid grid-cols-2 gap-3'>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Scale: {(componentLayouts.countdown.scale || 1).toFixed(1)}x
              </label>
              <input
                type='range'
                min='0.5'
                max='2'
                step='0.1'
                value={componentLayouts.countdown.scale || 1}
                onChange={e =>
                  updateCountdownLayout('scale', parseFloat(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
              />
            </div>
            <div>
              <label className='block text-xs text-gray-400 mb-1'>
                Min Width: {componentLayouts.countdown.minWidth || 320}px
              </label>
              <input
                type='range'
                min='250'
                max='500'
                step='50'
                value={componentLayouts.countdown.minWidth || 320}
                onChange={e =>
                  updateCountdownLayout('minWidth', parseInt(e.target.value))
                }
                className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Weather Effect Layout */}
      <div className='bg-gray-700/30 rounded-xl p-4 border border-gray-600'>
        <h4 className='font-semibold text-blue-400 mb-4 flex items-center gap-2'>
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
              d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
            />
          </svg>
          Weather Effects
        </h4>
        <div className='space-y-3'>
          <div>
            <label className='block text-xs text-gray-400 mb-1'>
              Particle Density: {(componentLayouts.weather.density || 1).toFixed(1)}x
            </label>
            <input
              type='range'
              min='0.5'
              max='2'
              step='0.1'
              value={componentLayouts.weather.density || 1}
              onChange={e =>
                updateWeatherLayout('density', parseFloat(e.target.value))
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
            />
          </div>
        </div>
      </div>
    </div>
  );
}
