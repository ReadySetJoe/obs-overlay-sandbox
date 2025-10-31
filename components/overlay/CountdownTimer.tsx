// components/overlay/CountdownTimer.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  CountdownTimer as CountdownTimerType,
  CountdownLayout,
} from '@/types/overlay';

interface CountdownTimerProps {
  timers: CountdownTimerType[];
  layout: CountdownLayout;
}

export default function CountdownTimer({
  timers,
  layout,
}: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<
    Record<
      string,
      {
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        expired: boolean;
      }
    >
  >({});

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const newTimeRemaining: typeof timeRemaining = {};

      timers.forEach(timer => {
        if (!timer.isActive) return;

        const target = new Date(timer.targetDate).getTime();
        const difference = target - now;

        if (difference <= 0) {
          newTimeRemaining[timer.id] = {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            expired: true,
          };
        } else {
          newTimeRemaining[timer.id] = {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor(
              (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            ),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
            expired: false,
          };
        }
      });

      setTimeRemaining(newTimeRemaining);
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const activeTimers = timers.filter(t => t.isActive);

  if (activeTimers.length === 0) return null;

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
        fixed ${positionClasses[layout.position]} transform transition-all duration-500 translate-y-0 opacity-100
      `}
      style={{
        zIndex: 15,
        width: `400px`,
        transform: `translate(${layout.position.includes('right') ? '-' : ''}${layout.x}px, ${layout.position.includes('bottom') ? '-' : ''}${layout.y}px) scale(${layout.scale})`,
        padding: '2rem',
      }}
    >
      {activeTimers.map(timer => {
        const time = timeRemaining[timer.id];
        if (!time) return null;

        return (
          <div
            key={timer.id}
            className='bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg rounded-2xl p-6 border border-purple-500/30 shadow-2xl animate-fade-in'
            style={{ minWidth: `${layout.minWidth}px` }}
          >
            {/* Timer Title */}
            <div className='mb-4 text-center'>
              <h3 className='text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent'>
                {timer.title}
              </h3>
              {timer.description && (
                <p className='text-sm text-gray-400 mt-1'>
                  {timer.description}
                </p>
              )}
            </div>

            {/* Countdown Display */}
            {time.expired ? (
              <div className='text-center py-4'>
                <div className='text-4xl font-bold text-green-400 animate-pulse'>
                  🎉 EVENT LIVE! 🎉
                </div>
              </div>
            ) : (
              <div className='grid grid-cols-4 gap-3'>
                {/* Days */}
                <div className='bg-purple-900/30 rounded-xl p-3 text-center border border-purple-500/20'>
                  <div className='text-3xl font-bold text-purple-400'>
                    {String(time.days).padStart(2, '0')}
                  </div>
                  <div className='text-xs text-gray-400 mt-1 uppercase tracking-wide'>
                    Days
                  </div>
                </div>

                {/* Hours */}
                <div className='bg-blue-900/30 rounded-xl p-3 text-center border border-blue-500/20'>
                  <div className='text-3xl font-bold text-blue-400'>
                    {String(time.hours).padStart(2, '0')}
                  </div>
                  <div className='text-xs text-gray-400 mt-1 uppercase tracking-wide'>
                    Hours
                  </div>
                </div>

                {/* Minutes */}
                <div className='bg-pink-900/30 rounded-xl p-3 text-center border border-pink-500/20'>
                  <div className='text-3xl font-bold text-pink-400'>
                    {String(time.minutes).padStart(2, '0')}
                  </div>
                  <div className='text-xs text-gray-400 mt-1 uppercase tracking-wide'>
                    Mins
                  </div>
                </div>

                {/* Seconds */}
                <div className='bg-cyan-900/30 rounded-xl p-3 text-center border border-cyan-500/20'>
                  <div className='text-3xl font-bold text-cyan-400'>
                    {String(time.seconds).padStart(2, '0')}
                  </div>
                  <div className='text-xs text-gray-400 mt-1 uppercase tracking-wide'>
                    Secs
                  </div>
                </div>
              </div>
            )}

            {/* Progress bar showing time elapsed */}
            {!time.expired && (
              <div className='mt-4'>
                <div className='h-2 bg-gray-700/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full transition-all duration-1000'
                    style={{
                      width: `${
                        ((new Date(timer.targetDate).getTime() -
                          new Date().getTime()) /
                          (new Date(timer.targetDate).getTime() -
                            new Date(timer.targetDate).getTime() +
                            7 * 24 * 60 * 60 * 1000)) *
                        100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
