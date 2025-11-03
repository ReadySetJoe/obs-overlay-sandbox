// components/dashboard/tiles/SummaryTile.tsx
'use client';

import ToggleSwitch from '../ToggleSwitch';
import { colorClasses, ThemeColor } from '@/lib/theme';

interface SummaryTileProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: ThemeColor;
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
  const hoverBorderClass = colorClasses[color]?.hoverBorder || 'hover:border-gray-500/50';

  return (
    <div
      onClick={onClick}
      className={`relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl ${hoverBorderClass} cursor-pointer transition-all group`}
    >
      <div className='mb-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            {icon}
            <div>
              <h3 className='text-lg font-bold text-white'>{title}</h3>
              <p className='text-xs text-gray-400'>{subtitle}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition`}
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
        </div>
      </div>
      {onToggleVisibility !== undefined && isVisible !== undefined && (
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-500'>
            {isVisible ? 'Visible' : 'Hidden'}
          </span>
          <ToggleSwitch
            checked={isVisible}
            onChange={onToggleVisibility}
            color={color}
          />
        </div>
      )}
    </div>
  );
}
