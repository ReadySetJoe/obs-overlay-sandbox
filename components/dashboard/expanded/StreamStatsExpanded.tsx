// components/dashboard/expanded/StreamStatsExpanded.tsx
'use client';

import { useState } from 'react';
import { StreamStatsConfig, ComponentLayouts } from '@/types/overlay';
import PositionControls from '../PositionControls';
import CopyURLButton from '../CopyURLButton';

interface StreamStatsExpandedProps {
  sessionId: string;
  config: StreamStatsConfig;
  componentLayouts: ComponentLayouts;
  onConfigChange: (config: StreamStatsConfig) => void;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onDisplayModeChange: (
    mode: 'compact' | 'full' | 'goals-only' | 'metrics-only'
  ) => void;
  onClose: () => void;
}

export default function StreamStatsExpanded({
  sessionId,
  config,
  componentLayouts,
  onConfigChange,
  onPositionChange,
  onScaleChange,
  onDisplayModeChange,
  onClose,
}: StreamStatsExpandedProps) {
  const [localConfig, setLocalConfig] = useState<StreamStatsConfig>(config);
  const [resetting, setResetting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleChange = (updates: Partial<StreamStatsConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleSyncTwitch = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/stream-stats/sync-twitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          `Successfully synced!\nFollowers: ${data.followers}\nSubscribers: ${data.subscribers}`
        );
      } else {
        const error = await response.json();
        alert(`Failed to sync: ${error.error}`);
      }
    } catch (error) {
      console.error('Error syncing Twitch stats:', error);
      alert('Failed to sync Twitch stats');
    } finally {
      setTimeout(() => setSyncing(false), 1000);
    }
  };

  const handleResetStats = async () => {
    if (
      !confirm(
        'Reset all stream stats? This will clear message counts, chatters, and sentiment data.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/stream-stats/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to reset: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resetting stats:', error);
      alert('Failed to reset stats');
    } finally {
      setTimeout(() => setResetting(false), 1000);
    }
  };

  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl max-h-[90vh] overflow-y-auto'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6'>
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
        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
          📊
        </div>
        <div>
          <h2 className='text-xl font-bold'>Stream Stats & Goals</h2>
          <p className='text-sm text-gray-400'>
            Track goals, chat metrics, and positivity
          </p>
        </div>
      </div>

      {/* Position & Scale */}
      <div className='mb-6'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Position & Scale
        </h4>
        <PositionControls
          x={componentLayouts.streamStats?.x || 20}
          y={componentLayouts.streamStats?.y || 20}
          onPositionChange={onPositionChange}
          color='blue'
          elementWidth={350}
          elementHeight={400}
          scale={componentLayouts.streamStats?.scale || 1}
          isDynamicSize={true}
        />
        <div className='mt-3'>
          <label className='block text-xs text-gray-400 mb-1'>
            Scale: {(componentLayouts.streamStats?.scale || 1).toFixed(1)}x
          </label>
          <input
            type='range'
            min='0.5'
            max='2'
            step='0.1'
            value={componentLayouts.streamStats?.scale || 1}
            onChange={e => onScaleChange(parseFloat(e.target.value))}
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
          />
        </div>
      </div>

      {/* Display Mode */}
      <div className='mb-6'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Display Mode
        </h4>
        <div className='grid grid-cols-2 gap-2'>
          {[
            { value: 'full', label: '📊 Full', desc: 'Goals + Metrics' },
            { value: 'compact', label: '📉 Compact', desc: 'Minimal' },
            {
              value: 'goals-only',
              label: '🎯 Goals Only',
              desc: 'Just progress bars',
            },
            {
              value: 'metrics-only',
              label: '📈 Metrics Only',
              desc: 'Chat stats',
            },
          ].map(mode => (
            <button
              key={mode.value}
              onClick={() => onDisplayModeChange(mode.value as any)}
              className={`p-3 rounded-lg border-2 transition-all ${
                (componentLayouts.streamStats?.displayMode || 'full') ===
                mode.value
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-gray-700 bg-gray-800 hover:border-gray-600'
              }`}
            >
              <div className='font-semibold text-sm'>{mode.label}</div>
              <div className='text-xs text-gray-400 mt-1'>{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Goals Configuration */}
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-3'>
          <h4 className='text-sm font-semibold text-gray-200'>
            🎯 Goal Targets
          </h4>
          <button
            onClick={handleSyncTwitch}
            disabled={syncing}
            className='px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-2'
          >
            <span>🔄</span>
            <span>{syncing ? 'Syncing...' : 'Sync from Twitch'}</span>
          </button>
        </div>
        <p className='text-xs text-gray-400 mb-3'>
          Click "Sync from Twitch" to load your current follower/sub counts
        </p>
        <div className='space-y-3'>
          {/* Follower Goal */}
          <div className='bg-gray-800 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <span className='text-xl'>❤️</span>
                <span className='font-semibold'>Follower Goal</span>
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={localConfig.showFollowerGoal}
                  onChange={e =>
                    handleChange({ showFollowerGoal: e.target.checked })
                  }
                  className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-400'>Show</span>
              </label>
            </div>
            {localConfig.showFollowerGoal && (
              <input
                type='number'
                value={localConfig.followerGoal}
                onChange={e =>
                  handleChange({ followerGoal: parseInt(e.target.value) || 0 })
                }
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
                placeholder='100'
                min='0'
              />
            )}
          </div>

          {/* Sub Goal */}
          <div className='bg-gray-800 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <span className='text-xl'>⭐</span>
                <span className='font-semibold'>Subscriber Goal</span>
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={localConfig.showSubGoal}
                  onChange={e =>
                    handleChange({ showSubGoal: e.target.checked })
                  }
                  className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-400'>Show</span>
              </label>
            </div>
            {localConfig.showSubGoal && (
              <input
                type='number'
                value={localConfig.subGoal}
                onChange={e =>
                  handleChange({ subGoal: parseInt(e.target.value) || 0 })
                }
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
                placeholder='50'
                min='0'
              />
            )}
          </div>

          {/* Bits Goal */}
          <div className='bg-gray-800 rounded-lg p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <span className='text-xl'>💎</span>
                <span className='font-semibold'>Bits Goal</span>
              </div>
              <label className='flex items-center gap-2 cursor-pointer'>
                <input
                  type='checkbox'
                  checked={localConfig.showBitsGoal}
                  onChange={e =>
                    handleChange({ showBitsGoal: e.target.checked })
                  }
                  className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
                />
                <span className='text-sm text-gray-400'>Show</span>
              </label>
            </div>
            {localConfig.showBitsGoal && (
              <input
                type='number'
                value={localConfig.bitsGoal}
                onChange={e =>
                  handleChange({ bitsGoal: parseInt(e.target.value) || 0 })
                }
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-white'
                placeholder='1000'
                min='0'
              />
            )}
          </div>
        </div>
      </div>

      {/* Metrics Configuration */}
      <div className='mb-6'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          📈 Visible Metrics
        </h4>
        <div className='space-y-2'>
          {[
            {
              key: 'showTotalMessages',
              label: '💬 Total Messages',
              desc: 'Total chat messages sent',
            },
            {
              key: 'showUniqueChatters',
              label: '👥 Unique Chatters',
              desc: 'Number of unique users who chatted',
            },
            {
              key: 'showMessagesPerMinute',
              label: '📊 Messages/Min',
              desc: 'Chat activity rate',
            },
            {
              key: 'showMostActiveChatter',
              label: '🔥 Most Active Chatter',
              desc: 'User with most messages',
            },
            {
              key: 'showPositivityScore',
              label: '😊 Positivity Score',
              desc: 'Average chat sentiment',
            },
            {
              key: 'showNicestChatter',
              label: '💖 Nicest Chatter',
              desc: 'Most positive user',
            },
          ].map(metric => (
            <label
              key={metric.key}
              className='flex items-center justify-between p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-750 transition-colors'
            >
              <div>
                <div className='font-medium text-sm'>{metric.label}</div>
                <div className='text-xs text-gray-400'>{metric.desc}</div>
              </div>
              <input
                type='checkbox'
                checked={
                  localConfig[metric.key as keyof StreamStatsConfig] as boolean
                }
                onChange={e => handleChange({ [metric.key]: e.target.checked })}
                className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-500 focus:ring-blue-500'
              />
            </label>
          ))}
        </div>
      </div>

      {/* Reset Section */}
      <div className='mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg'>
        <div className='flex items-center justify-between mb-2'>
          <h4 className='font-semibold'>🗑️ Reset Stats</h4>
          <button
            onClick={handleResetStats}
            disabled={resetting}
            className='px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors'
          >
            {resetting ? 'Resetting...' : 'Reset All Stats'}
          </button>
        </div>
        <p className='text-sm text-gray-300'>
          Clear all message counts, chatters, and sentiment data. Goals will
          remain.
        </p>
      </div>

      {/* Info Box */}
      <div className='p-4 bg-blue-900/30 border border-blue-700 rounded-lg'>
        <h4 className='font-semibold mb-2'>💡 How It Works</h4>
        <ul className='text-sm text-gray-300 space-y-1 list-disc list-inside'>
          <li>
            <strong>Goals:</strong> Track progress toward follower/sub/bits
            milestones
          </li>
          <li>
            <strong>Chat Metrics:</strong> Automatically tracked from Twitch
            chat
          </li>
          <li>
            <strong>Sentiment Analysis:</strong> AI analyzes chat positivity in
            real-time
          </li>
          <li>
            <strong>Nicest Chatter:</strong> Ranks users by average message
            positivity
          </li>
          <li>
            <strong>Auto-Reset:</strong> Option to clear stats when stream
            starts
          </li>
        </ul>
      </div>

      {/* Copy URL */}
      <div className='mb-6 space-y-3'>
        <CopyURLButton
          url={`${window.location.origin}/overlay/${sessionId}/stream-stats`}
          label='Stream Stats Overlay URL'
        />
        <p className='text-xs text-gray-400 mt-2'>
          Individual overlay showing only stream stats
        </p>
      </div>
    </div>
  );
}
