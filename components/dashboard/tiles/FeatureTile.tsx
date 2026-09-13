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
 * Replaces the full-width row of icon + title + subtitle + switch. The
 * visibility control is a real button rather than something behind the detail
 * panel, because the dashboard is used live, mid-stream.
 */
export default function FeatureTile({
  feature,
  isVisible,
  onToggleVisibility,
  onClick,
}: FeatureTileProps) {
  const Icon = FEATURE_ICONS[feature.id];
  const hoverBorder =
    colorClasses[feature.color]?.hoverBorder || 'hover:border-gray-500/50';

  // Emit exactly one border and one background class. Listing both
  // `border-gray-700` and `border-green-500/60` would leave the winner to
  // generated-stylesheet order rather than to this ternary. The hover border is
  // also suppressed while visible, since it is a `hover:` variant and would
  // otherwise outrank the green cue on hover - dropping one of only two
  // signals that the element is on stream.
  const stateClasses = isVisible
    ? 'border-green-500/60 bg-green-900/20'
    : `border-gray-700 bg-gray-800/60 ${hoverBorder}`;

  return (
    <div
      className={`relative rounded-lg border transition-colors ${stateClasses}`}
    >
      {/* The test id goes on the button that owns onClick, NOT the wrapper.
          getByTestId(...).click() targets an element's geometric centre, so a
          wrapper div with no handler can swallow the click on its padding.
          h-full so shorter tiles in a mixed-height row have no dead strip. */}
      <button
        data-testid={`tile-${feature.id}`}
        type='button'
        onClick={onClick}
        className='flex h-full w-full cursor-pointer flex-col items-center gap-1 p-3 text-center'
      >
        <span className='text-xl'>
          <Icon />
        </span>
        <span className='text-[11px] leading-tight text-gray-200'>
          {feature.name}
        </span>
      </button>

      {onToggleVisibility && (
        <button
          type='button'
          data-testid={`toggle-${feature.id}`}
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${feature.name}`}
          aria-pressed={!!isVisible}
          title={
            isVisible ? 'On stream - click to hide' : 'Hidden - click to show'
          }
          onClick={onToggleVisibility}
          // The dot is 10px but the hit area is 24px, per WCAG 2.5.8. It stays
          // in the top-right corner so it never overlaps the expand button's
          // centre point - if it did, clicking the tile would toggle visibility
          // instead of opening the panel.
          className='absolute right-0 top-0 flex h-6 w-6 cursor-pointer items-center justify-center'
        >
          <span
            className={`block h-2.5 w-2.5 rounded-full border transition-colors ${
              isVisible
                ? 'border-green-300 bg-green-400'
                : 'border-gray-400 bg-gray-600'
            }`}
          />
        </button>
      )}
    </div>
  );
}
