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
        <h3 className='text-xs font-bold uppercase tracking-wide text-gray-300'>
          {CATEGORY_LABELS[category]}
        </h3>
        <span className='text-xs text-gray-500'>{features.length}</span>
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {features.map(feature => (
          <FeatureTile
            key={feature.id}
            feature={feature}
            isVisible={
              feature.layerId ? visibility[feature.layerId] : undefined
            }
            onToggleVisibility={
              feature.layerId
                ? () => onToggleLayer(feature.layerId as string)
                : undefined
            }
            onClick={() => onExpand(feature.id)}
          />
        ))}
      </div>
    </div>
  );
}
