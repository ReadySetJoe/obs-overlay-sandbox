// components/dashboard/expanded/NowPlayingExpanded.tsx
'use client';

import PositionControls from '../PositionControls';
import CopyURLButton from '../CopyURLButton';
import { ComponentLayouts } from '@/types/overlay';

interface NowPlayingExpandedProps {
  spotifyToken: string | null;
  sessionId: string;
  trackTitle: string;
  trackArtist: string;
  trackAlbumArt: string;
  isPlaying: boolean;
  isVisible: boolean;
  componentLayouts: ComponentLayouts;
  onDisconnect: () => void;
  onToggleVisibility: () => void;
  onPositionChange: (x: number, y: number) => void;
  onWidthChange: (width: number) => void;
  onScaleChange: (scale: number) => void;
  onTrackTitleChange: (title: string) => void;
  onTrackArtistChange: (artist: string) => void;
  onTrackAlbumArtChange: (url: string) => void;
  onIsPlayingChange: (playing: boolean) => void;
  onManualUpdate: () => void;
  onClose: () => void;
}

export default function NowPlayingExpanded({
  spotifyToken,
  sessionId,
  trackTitle,
  trackArtist,
  trackAlbumArt,
  isPlaying,
  isVisible,
  componentLayouts,
  onDisconnect,
  onToggleVisibility,
  onPositionChange,
  onWidthChange,
  onScaleChange,
  onTrackTitleChange,
  onTrackArtistChange,
  onTrackAlbumArtChange,
  onIsPlayingChange,
  onManualUpdate,
  onClose,
}: NowPlayingExpandedProps) {
  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
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
          <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center'>
            <svg className='w-6 h-6' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
            </svg>
          </div>
          <h2 className='text-xl font-bold'>Now Playing</h2>
        </div>
        <button
          onClick={onToggleVisibility}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isVisible
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVisible ? '👁️ Visible' : '🚫 Hidden'}
        </button>
      </div>

      {!spotifyToken ? (
        <div className='text-center py-6'>
          <div className='mb-4 text-gray-300'>
            Connect your Spotify account to display what you&apos;re listening
            to
          </div>
          <a
            href={`/api/spotify/login?sessionId=${sessionId}`}
            className='inline-block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl px-8 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-xl'
          >
            Connect Spotify
          </a>
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse' />
              <span className='text-xs text-gray-400'>
                Auto-updating every 5s
              </span>
            </div>
            <button
              onClick={onDisconnect}
              className='text-xs text-red-400 hover:text-red-300 transition'
            >
              Disconnect
            </button>
          </div>

          {trackTitle && (
            <div className='bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 border border-gray-600'>
              <div className='flex items-center gap-4'>
                {trackAlbumArt && (
                  <img
                    src={trackAlbumArt}
                    alt='Album art'
                    className='w-20 h-20 rounded-lg shadow-lg'
                  />
                )}
                <div className='flex-1 min-w-0'>
                  <div className='font-bold text-white truncate'>
                    {trackTitle}
                  </div>
                  <div className='text-sm text-gray-400 truncate'>
                    {trackArtist}
                  </div>
                  <div className='flex items-center gap-2 mt-2'>
                    {isPlaying ? (
                      <div className='flex items-center gap-1 text-xs text-green-400'>
                        <div className='w-1 h-3 bg-green-400 rounded animate-pulse' />
                        <div className='w-1 h-4 bg-green-400 rounded animate-pulse delay-75' />
                        <div className='w-1 h-2 bg-green-400 rounded animate-pulse delay-150' />
                        <span className='ml-1'>Playing</span>
                      </div>
                    ) : (
                      <div className='text-xs text-gray-500'>Paused</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Position & Size Controls */}
          <div className='mt-4'>
            <h4 className='text-sm font-semibold text-gray-300 mb-3'>
              Position & Size
            </h4>
            <PositionControls
              x={componentLayouts.nowPlaying.x || 0}
              y={componentLayouts.nowPlaying.y || 0}
              onPositionChange={onPositionChange}
              color='green'
              elementWidth={componentLayouts.nowPlaying.width || 400}
              elementHeight={120}
              scale={componentLayouts.nowPlaying.scale || 1}
            />
            <div className='grid grid-cols-2 gap-3 mt-3'>
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
                  onChange={e => onWidthChange(parseInt(e.target.value))}
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
                  onChange={e => onScaleChange(parseFloat(e.target.value))}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
                />
              </div>
            </div>
          </div>

          {/* Manual Override */}
          <details className='group mt-4'>
            <summary className='cursor-pointer text-xs text-gray-400 hover:text-gray-300 transition list-none flex items-center gap-2'>
              <svg
                className='w-4 h-4 transition-transform group-open:rotate-90'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5l7 7-7 7'
                />
              </svg>
              Manual Override
            </summary>
            <div className='mt-4 space-y-3'>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Track Title
                </label>
                <input
                  type='text'
                  value={trackTitle}
                  onChange={e => onTrackTitleChange(e.target.value)}
                  className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:outline-none'
                  placeholder='Song name'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Artist
                </label>
                <input
                  type='text'
                  value={trackArtist}
                  onChange={e => onTrackArtistChange(e.target.value)}
                  className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:outline-none'
                  placeholder='Artist name'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Album Art URL
                </label>
                <input
                  type='text'
                  value={trackAlbumArt}
                  onChange={e => onTrackAlbumArtChange(e.target.value)}
                  className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:outline-none'
                  placeholder='https://...'
                />
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={isPlaying}
                  onChange={e => onIsPlayingChange(e.target.checked)}
                  className='w-4 h-4 accent-green-500'
                />
                <span className='text-sm text-gray-300'>Currently Playing</span>
              </label>
              <button
                onClick={onManualUpdate}
                className='w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600'
              >
                Update Manually
              </button>
            </div>
          </details>
        </div>
      )}

      {/* Copy URL for OBS */}
      <CopyURLButton
        url={`${window.location.origin}/overlay/${sessionId}/now-playing`}
      />
    </div>
  );
}
