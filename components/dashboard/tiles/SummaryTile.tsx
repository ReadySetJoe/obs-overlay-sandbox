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
}

export default function SummaryTile({
  title,
  subtitle,
  icon,
  color,
  isVisible,
  onToggleVisibility,
  onClick,
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
    <button
      onClick={onClick}
      className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl ${colorMap[color]} transition-all text-left group`}
    >
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-3'>
          <div className={`w-12 h-12 bg-gradient-to-br ${gradientMap[color]} rounded-xl flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className='text-lg font-bold text-white'>{title}</h3>
            <p className='text-xs text-gray-400'>{subtitle}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 ${colorMap[color]} transition`}
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
        </svg>
      </div>
      {onToggleVisibility !== undefined && isVisible !== undefined && (
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-500'>{isVisible ? 'Visible' : 'Hidden'}</span>
          <ToggleSwitch
            checked={isVisible}
            onChange={onToggleVisibility}
            color={color}
          />
        </div>
      )}
    </button>
  );
}
