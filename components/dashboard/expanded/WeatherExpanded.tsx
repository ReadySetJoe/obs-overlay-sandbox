// components/dashboard/expanded/WeatherExpanded.tsx
'use client';

import { WeatherEffect, ComponentLayouts } from '@/types/overlay';
import CopyURLButton from '../CopyURLButton';
import { WeatherIcon } from '../tiles/TileIcons';

interface WeatherExpandedProps {
  sessionId: string;
  weatherEffect: WeatherEffect;
  isVisible: boolean;
  componentLayouts: ComponentLayouts;
  onWeatherChange: (effect: WeatherEffect) => void;
  onToggleVisibility: () => void;
  onDensityChange: (density: number) => void;
  onClose: () => void;
}

export default function WeatherExpanded({
  sessionId,
  weatherEffect,
  isVisible,
  componentLayouts,
  onWeatherChange,
  onToggleVisibility,
  onDensityChange,
  onClose,
}: WeatherExpandedProps) {
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
          <WeatherIcon />
          <h2 className='text-xl font-bold'>Weather Effects</h2>
        </div>
        <button
          onClick={onToggleVisibility}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isVisible
              ? 'bg-cyan-600 hover:bg-cyan-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVisible ? '👁️ Visible' : '🚫 Hidden'}
        </button>
      </div>
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6'>
        {(
          [
            'none',
            'rain',
            'snow',
            'hearts',
            'stars',
            'bubbles',
            'leaves',
            'sakura',
          ] as WeatherEffect[]
        ).map(effect => {
          // Define emoji icons for each effect
          const icons: Record<WeatherEffect, string> = {
            none: '🚫',
            rain: '🌧️',
            snow: '❄️',
            hearts: '💖',
            stars: '⭐',
            bubbles: '🫧',
            leaves: '🍂',
            sakura: '🌸',
          };

          return (
            <button
              key={effect}
              onClick={() => onWeatherChange(effect)}
              className={`group relative rounded-xl px-3 py-3 font-semibold capitalize transition-all duration-200 shadow-lg hover:shadow-xl overflow-hidden border ${
                weatherEffect === effect
                  ? 'bg-linear-to-br from-cyan-600/80 to-blue-600/80 border-cyan-500'
                  : 'bg-linear-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className='absolute inset-0 bg-linear-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000' />
              <div className='relative flex flex-col items-center gap-1'>
                <span className='text-2xl'>{icons[effect]}</span>
                <span className='text-xs'>{effect}</span>
              </div>
            </button>
          );
        })}
      </div>
      <div>
        <label className='block text-xs text-gray-400 mb-1'>
          Particle Density: {(componentLayouts.weather.density || 1).toFixed(1)}
          x
        </label>
        <input
          type='range'
          min='0.5'
          max='2'
          step='0.1'
          value={componentLayouts.weather.density || 1}
          onChange={e => onDensityChange(parseFloat(e.target.value))}
          className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500'
        />
      </div>

      {/* Copy URL for OBS */}
      <CopyURLButton
        url={`${window.location.origin}/overlay/${sessionId}/weather`}
      />
    </div>
  );
}
