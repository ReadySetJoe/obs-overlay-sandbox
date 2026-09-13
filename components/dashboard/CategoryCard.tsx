// components/dashboard/CategoryCard.tsx
'use client';

import type { FeatureCategory } from '@/lib/dashboardFeatures';
import { CATEGORY_LABELS, featuresByCategory } from '@/lib/dashboardFeatures';
import FeatureTile from './tiles/FeatureTile';

interface CategoryCardProps {
  category: FeatureCategory;
  /** Layer id -> visible. Features with a null layerId are not looked up. */
  visibility: Record<string, boolean>;
  onToggleLayer: (layerId: string) => void;
  onExpand: (featureId: string) => void;
  /** Appearance is de-emphasised: it is configured before streaming. */
  dimmed?: boolean;
}

export default function CategoryCard({
  category,
  visibility,
  onToggleLayer,
  onExpand,
  dimmed = false,
}: CategoryCardProps) {
  const features = featuresByCategory(category);

  return (
    <div
      data-testid={`category-${category}`}
      className={`rounded-lg border border-gray-700 p-3 ${dimmed ? 'opacity-75' : ''}`}
    >
      <div className='mb-2 flex items-center gap-2'>
        <h2 className='text-xs font-bold uppercase tracking-wide text-gray-300'>
          {CATEGORY_LABELS[category]}
        </h2>
        {/* Decorative: the tiles themselves convey the count to a screen
            reader, so announcing "Alerts & Events 2" adds nothing. */}
        <span aria-hidden='true' className='text-xs text-gray-400'>
          {features.length}
        </span>
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {features.map(feature => {
          // Hoisted so the closure narrows naturally, instead of casting.
          const layerId = feature.layerId;

          return (
            <FeatureTile
              key={feature.id}
              feature={feature}
              isVisible={layerId ? visibility[layerId] : undefined}
              onToggleVisibility={
                layerId ? () => onToggleLayer(layerId) : undefined
              }
              onClick={() => onExpand(feature.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
