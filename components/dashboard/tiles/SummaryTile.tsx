// components/dashboard/tiles/SummaryTile.tsx
'use client';

import ToggleSwitch from '../ToggleSwitch';

interface SummaryTileProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'green' | 'yellow' | 'cyan' | 'purple' | 'pink';
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onClick: () => void;
  disabled?: boolean;
  authRequired?: boolean;
  onAuthClick?: () => void;
}

export default function SummaryTile({
  title,
  subtitle,
  icon,
  color,
  isVisible,
  onToggleVisibility,
  onClick,
  disabled = false,
  authRequired = false,
  onAuthClick,
}: SummaryTileProps) {
  const colorMap = {
    green: 'hover:border-green-500/50 group-hover:text-green-400',
    yellow: 'hover:border-yellow-500/50 group-hover:text-yellow-400',
    cyan: 'hover:border-cyan-500/50 group-hover:text-cyan-400',
    purple: 'hover:border-purple-500/50 group-hover:text-purple-400',
    pink: 'hover:border-pink-500/50 group-hover:text-pink-400',
  };

  const gradientMap = {
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-orange-500',
    cyan: 'from-cyan-500 to-blue-500',
    purple: 'from-blue-500 to-purple-500',
    pink: 'from-pink-500 to-purple-500',
  };

  return (
    <div
      className={`relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl ${
        disabled ? 'opacity-50 cursor-not-allowed' : `${colorMap[color]} cursor-pointer`
      } transition-all group`}
    >
      <div onClick={disabled ? undefined : onClick} className='mb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className={`w-12 h-12 bg-gradient-to-br ${disabled ? 'from-gray-600 to-gray-700' : gradientMap[color]} rounded-xl flex items-center justify-center`}>
              {icon}
            </div>
            <div>
              <h3 className='text-lg font-bold text-white'>{title}</h3>
              <p className='text-xs text-gray-400'>{subtitle}</p>
            </div>
          </div>
          {!disabled && !authRequired && (
            <svg
              className={`w-5 h-5 text-gray-400 ${colorMap[color]} transition`}
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          )}
        </div>
      </div>
      {onToggleVisibility !== undefined && isVisible !== undefined && !disabled && !authRequired && (
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-500'>{isVisible ? 'Visible' : 'Hidden'}</span>
          <ToggleSwitch
            checked={isVisible}
            onChange={onToggleVisibility}
            color={color}
          />
        </div>
      )}

      {/* Authentication Overlay */}
      {authRequired && onAuthClick && (
        <div className='absolute inset-0 bg-gray-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center'>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAuthClick();
            }}
            className='bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform hover:scale-105 flex items-center gap-2 shadow-lg'
          >
            <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24'>
              <path d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z' />
            </svg>
            Connect with Twitch
          </button>
        </div>
      )}
    </div>
  );
}
