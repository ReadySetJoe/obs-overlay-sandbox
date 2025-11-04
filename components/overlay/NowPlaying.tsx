// components/overlay/NowPlaying.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  NowPlaying as NowPlayingType,
  NowPlayingLayout,
} from '@/types/overlay';
import Image from 'next/image';

interface NowPlayingProps {
  track: NowPlayingType | null;
  layout: NowPlayingLayout;
}

export default function NowPlaying({ track, layout }: NowPlayingProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [dominantColor, setDominantColor] = useState<string>('#16a34a');
  const [accentColor, setAccentColor] = useState<string>('#166534');

  useEffect(() => {
    if (track?.isPlaying) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [track?.isPlaying]);

  // Extract colors from album art
  useEffect(() => {
    if (!track?.albumArt) return;

    const extractColors = async () => {
      try {
        const ColorThief = (await import('colorthief')).default;
        const colorThief = new ColorThief();

        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = track.albumArt;

        img.onload = () => {
          try {
            const palette = colorThief.getPalette(img, 2);
            if (palette && palette.length >= 2) {
              const [r1, g1, b1] = palette[0];
              const [r2, g2, b2] = palette[1];
              setDominantColor(`rgb(${r1}, ${g1}, ${b1})`);
              setAccentColor(`rgb(${r2}, ${g2}, ${b2})`);
            }
          } catch (err) {
            console.error('Error extracting colors:', err);
          }
        };
      } catch (err) {
        console.error('Error loading ColorThief:', err);
      }
    };

    extractColors();
  }, [track?.albumArt]);

  // Track progress smoothly
  useEffect(() => {
    if (!track || !track.isPlaying || !track.duration) {
      return;
    }

    // Set initial progress
    const initialProgress = track.progress || 0;
    const startTime = track.timestamp || Date.now();
    setCurrentProgress(initialProgress);

    // Update progress every 100ms for smooth animation
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = initialProgress + elapsed;

      const duration = track.duration || 0;
      if (newProgress >= duration) {
        setCurrentProgress(duration);
      } else {
        setCurrentProgress(newProgress);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [track]);

  if (!track) return null;

  const progressPercent = track.duration
    ? (currentProgress / track.duration) * 100
    : 0;

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    custom: '',
  };

  return (
    <div
      className={`
        fixed ${positionClasses[layout.position]} transform transition-all duration-500
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}
      style={{
        zIndex: 10,
        width: `${layout.width}px`,
        transform: `translate(${layout.position.includes('right') ? '-' : ''}${layout.x}px, ${layout.position.includes('bottom') ? '-' : ''}${layout.y}px) scale(${layout.scale}) ${isVisible ? '' : 'translateY(100%)'}`,
        padding: '2rem',
      }}
    >
      <div
        className='rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm transition-colors duration-1000'
        style={{
          background: `linear-gradient(to bottom right, ${dominantColor}, ${accentColor})`,
        }}
      >
        <div className='flex items-center gap-4 p-4'>
          {/* Album Art */}
          <div className='relative w-20 h-20 shrink-0 rounded-md overflow-hidden shadow-lg'>
            {track.albumArt ? (
              <Image
                src={track.albumArt}
                alt='Album art'
                fill
                className='object-cover'
              />
            ) : (
              <div className='w-full h-full bg-gray-700 flex items-center justify-center'>
                <span className='text-4xl'>🎵</span>
              </div>
            )}
          </div>

          {/* Track Info */}
          <div className='flex-1 min-w-0 overflow-hidden'>
            <div className='flex items-center gap-2 mb-1'>
              <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse' />
              <span className='text-xs text-green-200 uppercase tracking-wider font-semibold'>
                Now Playing
              </span>
            </div>
            <div className='overflow-hidden mb-1'>
              <h3
                className='text-white font-bold text-lg whitespace-nowrap inline-block animate-scroll-text'
                style={{
                  animation:
                    track.title.length > 25
                      ? 'scroll-text 10s linear infinite'
                      : 'none',
                }}
              >
                {track.title}
              </h3>
            </div>
            <p className='text-green-100 text-sm truncate'>{track.artist}</p>
          </div>

          {/* Spotify Icon */}
          <div className='shrink-0 pr-2'>
            <svg
              className='w-8 h-8 text-white'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
            </svg>
          </div>
        </div>

        {/* Progress Bar */}
        <div className='h-1 bg-black bg-opacity-30'>
          <div
            className='h-full bg-white bg-opacity-60 transition-all duration-100 ease-linear'
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
