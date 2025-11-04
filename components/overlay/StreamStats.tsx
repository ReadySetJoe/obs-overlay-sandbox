// components/overlay/StreamStats.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  StreamStatsData,
  StreamStatsConfig,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import { useThemeColors, hexToRgba } from '@/hooks/useThemeColors';

interface StreamStatsProps {
  data: StreamStatsData;
  config: StreamStatsConfig;
  scale?: number;
  colorScheme?: ColorScheme;
  customColors?: CustomColors | null;
  displayMode?: 'compact' | 'full' | 'goals-only' | 'metrics-only';
}

export default function StreamStats({
  data,
  config,
  scale = 1,
  colorScheme = 'default',
  customColors = null,
  displayMode = 'full',
}: StreamStatsProps) {
  const theme = useThemeColors(colorScheme, customColors);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in on mount
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Helper to calculate progress percentage
  const getProgress = (current: number, goal: number) => {
    if (goal === 0) return 0;
    return Math.min((current / goal) * 100, 100);
  };

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Render goal card
  const renderGoal = (
    title: string,
    current: number,
    goal: number,
    icon: string,
    color: string
  ) => {
    const progress = getProgress(current, goal);
    const isComplete = current >= goal;

    return (
      <div
        className='backdrop-blur-sm rounded-lg border p-3'
        style={{
          background: hexToRgba(theme.primaryDark, 0.7),
          borderColor: hexToRgba(color, 0.4),
        }}
      >
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-2'>
            <span className='text-xl'>{icon}</span>
            <span
              className='font-semibold text-sm'
              style={{ color: theme.primaryText }}
            >
              {title}
            </span>
          </div>
          <div
            className='text-xs font-bold px-2 py-1 rounded'
            style={{
              background: hexToRgba(color, 0.2),
              color: theme.accentText,
            }}
          >
            {formatNumber(current)} / {formatNumber(goal)}
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className='h-2 rounded-full overflow-hidden'
          style={{
            background: hexToRgba(theme.secondary, 0.3),
          }}
        >
          <div
            className='h-full transition-all duration-500 ease-out'
            style={{
              width: `${progress}%`,
              background: isComplete
                ? `linear-gradient(to right, ${color}, ${theme.accent})`
                : color,
              boxShadow: isComplete
                ? `0 0 8px ${hexToRgba(color, 0.6)}`
                : 'none',
            }}
          />
        </div>

        {/* Percentage */}
        <div className='text-right mt-1'>
          <span
            className='text-xs font-medium'
            style={{ color: theme.secondaryText }}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
      </div>
    );
  };

  // Render metric card
  const renderMetric = (
    label: string,
    value: string | number,
    icon: string,
    color?: string
  ) => {
    return (
      <div
        className='backdrop-blur-sm rounded-lg border p-2.5 flex items-center gap-2'
        style={{
          background: hexToRgba(theme.primaryDark, 0.6),
          borderColor: hexToRgba(theme.accent, 0.3),
        }}
      >
        <div
          className='text-lg w-7 h-7 flex items-center justify-center rounded'
          style={{
            background: hexToRgba(color || theme.accent, 0.2),
          }}
        >
          {icon}
        </div>
        <div className='flex-1 min-w-0'>
          <div
            className='text-xs opacity-75 font-medium'
            style={{ color: theme.secondaryText }}
          >
            {label}
          </div>
          <div
            className='font-bold text-sm truncate'
            style={{ color: theme.primaryText }}
          >
            {value}
          </div>
        </div>
      </div>
    );
  };

  // Build goals list
  const goals = [];
  if (config.showFollowerGoal) {
    goals.push(
      renderGoal(
        'Followers',
        data.currentFollowers,
        config.followerGoal,
        '❤️',
        '#ef4444'
      )
    );
  }
  if (config.showSubGoal) {
    goals.push(
      renderGoal(
        'Subscribers',
        data.currentSubs,
        config.subGoal,
        '⭐',
        '#f59e0b'
      )
    );
  }
  if (config.showBitsGoal) {
    goals.push(
      renderGoal('Bits', data.currentBits, config.bitsGoal, '💎', '#8b5cf6')
    );
  }

  // Build metrics list
  const metrics = [];
  if (config.showTotalMessages) {
    metrics.push(
      renderMetric('Total Messages', formatNumber(data.totalMessages), '💬')
    );
  }
  if (config.showUniqueChatters) {
    metrics.push(
      renderMetric('Unique Chatters', formatNumber(data.uniqueChatters), '👥')
    );
  }
  if (config.showMessagesPerMinute) {
    metrics.push(
      renderMetric(
        'Messages/Min',
        data.messagesPerMinute.toFixed(1),
        '📊',
        '#3b82f6'
      )
    );
  }
  if (config.showMostActiveChatter && data.mostActiveChatter) {
    metrics.push(
      renderMetric(
        'Most Active',
        `${data.mostActiveChatter} (${data.mostActiveChatterCount})`,
        '🔥',
        '#f97316'
      )
    );
  }
  if (config.showPositivityScore) {
    const score = data.overallPositivityScore;
    const emoji = score > 2 ? '😊' : score > 0 ? '😐' : '😔';
    metrics.push(
      renderMetric(
        'Positivity',
        `${score >= 0 ? '+' : ''}${score.toFixed(1)}`,
        emoji,
        score > 0 ? '#10b981' : '#6b7280'
      )
    );
  }
  if (config.showNicestChatter && data.nicestChatter) {
    metrics.push(
      renderMetric(
        'Nicest Chatter',
        `${data.nicestChatter} (${data.nicestChatterScore >= 0 ? '+' : ''}${data.nicestChatterScore.toFixed(1)})`,
        '💖',
        '#ec4899'
      )
    );
  }

  // Check if we have anything to display
  const showGoals =
    (displayMode === 'full' || displayMode === 'goals-only') &&
    goals.length > 0;
  const showMetrics =
    (displayMode === 'full' ||
      displayMode === 'metrics-only' ||
      displayMode === 'compact') &&
    metrics.length > 0;

  if (!showGoals && !showMetrics) {
    return null;
  }

  // For compact mode, limit metrics to top 3
  const displayMetrics =
    displayMode === 'compact' ? metrics.slice(0, 3) : metrics;

  return (
    <div
      className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        className='space-y-3'
        style={{ minWidth: '300px', maxWidth: '400px' }}
      >
        {/* Goals */}
        {showGoals && (
          <div className='space-y-2'>
            {goals.map((goal, index) => (
              <div key={`goal-${index}`}>{goal}</div>
            ))}
          </div>
        )}

        {/* Metrics */}
        {showMetrics && (
          <div className='grid grid-cols-1 gap-2'>
            {displayMetrics.map((metric, index) => (
              <div key={`metric-${index}`}>{metric}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
