// components/overlay/EventLabels.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  EventLabelsData,
  EventLabelsConfig,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import { useThemeColors, hexToRgba } from '@/hooks/useThemeColors';

interface EventLabelsProps {
  data: EventLabelsData;
  config: EventLabelsConfig;
  scale?: number;
  colorScheme?: ColorScheme;
  customColors?: CustomColors | null;
}

export default function EventLabels({
  data,
  config,
  scale = 1,
  colorScheme = 'default',
  customColors = null,
}: EventLabelsProps) {
  const theme = useThemeColors(colorScheme, customColors);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const labels = [];

  if (config.showFollower && data.latestFollower) {
    labels.push({
      key: 'follower',
      label: config.followerLabel,
      value: data.latestFollower,
      icon: '❤️',
    });
  }

  if (config.showSub && data.latestSub) {
    labels.push({
      key: 'sub',
      label: config.subLabel,
      value: data.latestSub,
      icon: '⭐',
    });
  }

  if (config.showBits && data.latestBits) {
    labels.push({
      key: 'bits',
      label: config.bitsLabel,
      value: `${data.latestBits.username} (${data.latestBits.amount})`,
      icon: '💎',
    });
  }

  if (config.showRaid && data.latestRaid) {
    labels.push({
      key: 'raid',
      label: config.raidLabel,
      value: `${data.latestRaid.username} (${data.latestRaid.count})`,
      icon: '🎉',
    });
  }

  if (config.showGiftSub && data.latestGiftSub) {
    labels.push({
      key: 'giftsub',
      label: config.giftSubLabel,
      value: data.latestGiftSub.gifter,
      icon: '🎁',
    });
  }

  if (labels.length === 0) {
    return null;
  }

  return (
    <div
      className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        className='backdrop-blur-md rounded-xl border-2 shadow-2xl p-4'
        style={{
          background: `linear-gradient(to bottom right, ${hexToRgba(theme.primaryDark, 0.9)}, ${hexToRgba(theme.secondaryDark, 0.9)})`,
          borderColor: hexToRgba(theme.accent, 0.5),
          boxShadow: `0 8px 16px ${hexToRgba(theme.accent, 0.3)}`,
          minWidth: '280px',
        }}
      >
        {labels.map((item, index) => (
          <div
            key={item.key}
            className={`flex items-center gap-3 ${index > 0 ? 'mt-3 pt-3 border-t' : ''}`}
            style={{
              borderColor: index > 0 ? hexToRgba(theme.accent, 0.2) : undefined,
            }}
          >
            <div
              className='text-2xl w-8 h-8 flex items-center justify-center rounded-lg'
              style={{
                background: hexToRgba(theme.accent, 0.2),
              }}
            >
              {item.icon}
            </div>
            <div className='flex-1 min-w-0'>
              <div
                className='text-xs font-medium opacity-75'
                style={{ color: theme.secondaryText }}
              >
                {item.label}
              </div>
              <div
                className='font-bold text-sm truncate'
                style={{ color: theme.primaryText }}
              >
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
