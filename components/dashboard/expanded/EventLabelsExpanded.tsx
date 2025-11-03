// components/dashboard/expanded/EventLabelsExpanded.tsx
'use client';

import { useState } from 'react';
import { EventLabelsConfig, ComponentLayouts } from '@/types/overlay';
import PositionControls from '../PositionControls';
import CopyURLButton from '../CopyURLButton';

interface EventLabelsExpandedProps {
  sessionId: string;
  config: EventLabelsConfig;
  componentLayouts: ComponentLayouts;
  onConfigChange: (config: EventLabelsConfig) => void;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onClose: () => void;
}

export default function EventLabelsExpanded({
  sessionId,
  config,
  componentLayouts,
  onConfigChange,
  onPositionChange,
  onScaleChange,
  onClose,
}: EventLabelsExpandedProps) {
  const [localConfig, setLocalConfig] = useState<EventLabelsConfig>(config);
  const [testingEvent, setTestingEvent] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const handleChange = (updates: Partial<EventLabelsConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleTestEvent = async (eventType: string) => {
    setTestingEvent(eventType);
    try {
      const response = await fetch('/api/event-labels/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, eventType }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to trigger test: ${error.error}`);
      }
    } catch (error) {
      console.error('Error triggering test event:', error);
      alert('Failed to trigger test event');
    } finally {
      setTimeout(() => setTestingEvent(null), 1000);
    }
  };

  const handleResetTestData = async () => {
    if (
      !confirm(
        'Clear all test event data? This will remove all displayed events.'
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const response = await fetch('/api/event-labels/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to reset: ${error.error}`);
      }
    } catch (error) {
      console.error('Error resetting test data:', error);
      alert('Failed to reset test data');
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
        <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center'>
          📊
        </div>
        <div>
          <h2 className='text-xl font-bold'>Recent Events</h2>
          <p className='text-sm text-gray-400'>
            Display latest follower, sub, bits, etc.
          </p>
        </div>
      </div>

      {/* Position & Scale */}
      <div className='mb-6'>
        <h4 className='text-sm font-semibold text-gray-200 mb-3'>
          Position & Scale
        </h4>
        <PositionControls
          x={componentLayouts.eventLabels?.x || 20}
          y={componentLayouts.eventLabels?.y || 20}
          onPositionChange={onPositionChange}
          color='green'
          elementWidth={280}
          elementHeight={200}
          scale={componentLayouts.eventLabels?.scale || 1}
          isDynamicSize={true}
        />
        <div className='mt-3'>
          <label className='block text-xs text-gray-400 mb-1'>
            Scale: {(componentLayouts.eventLabels?.scale || 1).toFixed(1)}x
          </label>
          <input
            type='range'
            min='0.5'
            max='2'
            step='0.1'
            value={componentLayouts.eventLabels?.scale || 1}
            onChange={e => onScaleChange(parseFloat(e.target.value))}
            className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
          />
        </div>
      </div>

      {/* Event Toggles and Labels */}
      <div className='space-y-4'>
        {/* Latest Follower */}
        <div className='bg-gray-800 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>❤️</span>
              <span className='font-semibold'>Latest Follower</span>
            </div>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={localConfig.showFollower}
                onChange={e => handleChange({ showFollower: e.target.checked })}
                className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
              />
              <span className='text-sm text-gray-400'>Show</span>
            </label>
          </div>
          {localConfig.showFollower && (
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Label Text
              </label>
              <input
                type='text'
                value={localConfig.followerLabel}
                onChange={e => handleChange({ followerLabel: e.target.value })}
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 text-white'
                placeholder='Latest Follower'
              />
            </div>
          )}
        </div>

        {/* Latest Sub */}
        <div className='bg-gray-800 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>⭐</span>
              <span className='font-semibold'>Latest Subscriber</span>
            </div>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={localConfig.showSub}
                onChange={e => handleChange({ showSub: e.target.checked })}
                className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
              />
              <span className='text-sm text-gray-400'>Show</span>
            </label>
          </div>
          {localConfig.showSub && (
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Label Text
              </label>
              <input
                type='text'
                value={localConfig.subLabel}
                onChange={e => handleChange({ subLabel: e.target.value })}
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 text-white'
                placeholder='Latest Subscriber'
              />
            </div>
          )}
        </div>

        {/* Latest Bits */}
        <div className='bg-gray-800 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>💎</span>
              <span className='font-semibold'>Latest Bits</span>
            </div>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={localConfig.showBits}
                onChange={e => handleChange({ showBits: e.target.checked })}
                className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
              />
              <span className='text-sm text-gray-400'>Show</span>
            </label>
          </div>
          {localConfig.showBits && (
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Label Text
              </label>
              <input
                type='text'
                value={localConfig.bitsLabel}
                onChange={e => handleChange({ bitsLabel: e.target.value })}
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 text-white'
                placeholder='Latest Bits'
              />
            </div>
          )}
        </div>

        {/* Latest Raid */}
        <div className='bg-gray-800 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>🎉</span>
              <span className='font-semibold'>Latest Raid</span>
            </div>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={localConfig.showRaid}
                onChange={e => handleChange({ showRaid: e.target.checked })}
                className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
              />
              <span className='text-sm text-gray-400'>Show</span>
            </label>
          </div>
          {localConfig.showRaid && (
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Label Text
              </label>
              <input
                type='text'
                value={localConfig.raidLabel}
                onChange={e => handleChange({ raidLabel: e.target.value })}
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 text-white'
                placeholder='Latest Raid'
              />
            </div>
          )}
        </div>

        {/* Latest Gift Sub */}
        <div className='bg-gray-800 rounded-lg p-4'>
          <div className='flex items-center justify-between mb-3'>
            <div className='flex items-center gap-2'>
              <span className='text-2xl'>🎁</span>
              <span className='font-semibold'>Latest Gift Sub</span>
            </div>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={localConfig.showGiftSub}
                onChange={e => handleChange({ showGiftSub: e.target.checked })}
                className='w-5 h-5 rounded bg-gray-700 border-gray-600 text-purple-500 focus:ring-purple-500'
              />
              <span className='text-sm text-gray-400'>Show</span>
            </label>
          </div>
          {localConfig.showGiftSub && (
            <div>
              <label className='block text-sm font-medium text-gray-300 mb-2'>
                Label Text
              </label>
              <input
                type='text'
                value={localConfig.giftSubLabel}
                onChange={e => handleChange({ giftSubLabel: e.target.value })}
                className='w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:outline-none focus:border-purple-500 text-white'
                placeholder='Latest Gift Sub'
              />
            </div>
          )}
        </div>
      </div>

      {/* Test Section */}
      <div className='mt-6 p-4 bg-purple-900/30 border border-purple-700 rounded-lg'>
        <div className='flex items-center justify-between mb-3'>
          <h4 className='font-semibold'>🧪 Test Events</h4>
          <button
            onClick={handleResetTestData}
            disabled={resetting}
            className='px-3 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2'
          >
            <span>🗑️</span>
            <span>{resetting ? 'Resetting...' : 'Reset All'}</span>
          </button>
        </div>
        <p className='text-sm text-gray-300 mb-4'>
          Trigger test events to see how they appear on your overlay
        </p>
        <div className='grid grid-cols-2 gap-3'>
          <button
            onClick={() => handleTestEvent('follower')}
            disabled={testingEvent === 'follower'}
            className='px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            <span>❤️</span>
            <span>Test Follower</span>
          </button>
          <button
            onClick={() => handleTestEvent('sub')}
            disabled={testingEvent === 'sub'}
            className='px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            <span>⭐</span>
            <span>Test Sub</span>
          </button>
          <button
            onClick={() => handleTestEvent('bits')}
            disabled={testingEvent === 'bits'}
            className='px-4 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            <span>💎</span>
            <span>Test Bits</span>
          </button>
          <button
            onClick={() => handleTestEvent('raid')}
            disabled={testingEvent === 'raid'}
            className='px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2'
          >
            <span>🎉</span>
            <span>Test Raid</span>
          </button>
          <button
            onClick={() => handleTestEvent('giftsub')}
            disabled={testingEvent === 'giftsub'}
            className='px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 col-span-2'
          >
            <span>🎁</span>
            <span>Test Gift Sub</span>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className='mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg'>
        <h4 className='font-semibold mb-2'>💡 How It Works</h4>
        <ul className='text-sm text-gray-300 space-y-1 list-disc list-inside'>
          <li>Labels automatically update when events occur on stream</li>
          <li>Toggle which events you want to display</li>
          <li>Customize the label text for each event type</li>
          <li>Position and scale using the Position Controls</li>
        </ul>
      </div>

      {/* Copy URL */}
      <div className='mb-6 space-y-3'>
        <CopyURLButton
          url={`${window.location.origin}/overlay/${sessionId}/event-labels`}
          label='Event Labels Overlay URL'
        />
        <p className='text-xs text-gray-400 mt-2'>
          Individual overlay showing only event labels
        </p>
      </div>
    </div>
  );
}
