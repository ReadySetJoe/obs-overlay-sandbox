// components/dashboard/tiles/FeatureTile.tsx
'use client';

import { colorClasses } from '@/lib/theme';
import type { DashboardFeature } from '@/lib/dashboardFeatures';
import { FEATURE_ICONS } from './featureIcons';

interface FeatureTileProps {
  feature: DashboardFeature;
  /** Undefined for features with no visibility layer. */
  isVisible?: boolean;
  /** Absent for features with no visibility layer. */
  onToggleVisibility?: () => void;
  onClick: () => void;
}

/**
 * One compact dashboard tile.
 *
 * Replaces the full-width SummaryTile row in the grid. The visibility dot is
 * the primary state cue and is a real button, so it can be hit without opening
 * the detail panel - the dashboard is used live, mid-stream.
 */
export default function FeatureTile({
  feature,
  isVisible,
  onToggleVisibility,
  onClick,
}: FeatureTileProps) {
  const Icon = FEATURE_ICONS[feature.id] ?? null;
  const hoverBorder =
    colorClasses[feature.color]?.hoverBorder || 'hover:border-gray-500/50';

  return (
    <div
      className={`relative rounded-lg border border-gray-700 bg-gray-800/60 transition-colors ${hoverBorder} ${
        isVisible ? 'border-green-500/60 bg-green-900/20' : ''
      }`}
    >
      {/* The test id goes on the button that owns onClick, NOT the wrapper.
          getByTestId(...).click() targets an element's geometric centre, so a
          wrapper div with no handler can swallow the click on its padding. */}
      <button
        data-testid={`tile-${feature.id}`}
        type='button'
        onClick={onClick}
        className='flex w-full flex-col items-center gap-1 p-3 text-center'
      >
        <span className='text-xl'>{Icon ? <Icon /> : null}</span>
        <span className='text-[11px] leading-tight text-gray-200'>
          {feature.name}
        </span>
      </button>

      {onToggleVisibility && (
        <button
          type='button'
          data-testid={`toggle-${feature.id}`}
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${feature.name}`}
          onClick={onToggleVisibility}
          className='absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full transition-colors'
          style={{ backgroundColor: isVisible ? '#34d399' : '#4b5563' }}
        />
      )}
    </div>
  );
}
