// components/dashboard/expanded/CountdownExpanded.tsx
'use client';

import { CountdownTimer, ComponentLayouts } from '@/types/overlay';
import PositionControls from '../PositionControls';
import { Pencil } from 'lucide-react';

interface CountdownExpandedProps {
  timers: CountdownTimer[];
  isVisible: boolean;
  isAuthenticated: boolean;
  showTimerForm: boolean;
  editingTimerId: string | null;
  newTimerTitle: string;
  newTimerDescription: string;
  newTimerDate: string;
  componentLayouts: ComponentLayouts;
  onToggleVisibility: () => void;
  onShowTimerForm: () => void;
  onCreateTimer: () => void;
  onCancelTimerForm: () => void;
  onStartEditingTimer: (timer: CountdownTimer) => void;
  onDeleteTimer: (timerId: string) => void;
  onToggleTimer: (timerId: string, isActive: boolean) => void;
  onNewTimerTitleChange: (title: string) => void;
  onNewTimerDescriptionChange: (description: string) => void;
  onNewTimerDateChange: (date: string) => void;
  onPositionChange: (x: number, y: number) => void;
  onScaleChange: (scale: number) => void;
  onMinWidthChange: (minWidth: number) => void;
}

export default function CountdownExpanded({
  timers,
  isVisible,
  isAuthenticated,
  showTimerForm,
  editingTimerId,
  newTimerTitle,
  newTimerDescription,
  newTimerDate,
  componentLayouts,
  onToggleVisibility,
  onShowTimerForm,
  onCreateTimer,
  onCancelTimerForm,
  onStartEditingTimer,
  onDeleteTimer,
  onToggleTimer,
  onNewTimerTitleChange,
  onNewTimerDescriptionChange,
  onNewTimerDateChange,
  onPositionChange,
  onScaleChange,
  onMinWidthChange,
}: CountdownExpandedProps) {
  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
          </div>
          <h2 className='text-xl font-bold'>Countdown Timers</h2>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={onToggleVisibility}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              isVisible ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {isVisible ? '👁️ Visible' : '🚫 Hidden'}
          </button>
          {isAuthenticated && !showTimerForm && (
            <button
              onClick={onShowTimerForm}
              className='bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg px-4 py-2 text-sm font-semibold transition'
            >
              + Add Timer
            </button>
          )}
        </div>
      </div>

      {!isAuthenticated ? (
        <div className='text-center py-4 text-gray-400 text-sm'>
          Sign in with Twitch to create countdown timers
        </div>
      ) : (
        <>
          {/* Timer Form */}
          {showTimerForm && (
            <div className='mb-6 bg-gray-700/30 rounded-xl p-4 border border-gray-600 space-y-3'>
              <h3 className='text-sm font-semibold text-yellow-400 mb-3'>
                {editingTimerId ? 'Edit Timer' : 'Create New Timer'}
              </h3>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Event Title</label>
                <input
                  type='text'
                  value={newTimerTitle}
                  onChange={(e) => onNewTimerTitleChange(e.target.value)}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                  placeholder='Stream starts, Tournament begins...'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Description (optional)</label>
                <input
                  type='text'
                  value={newTimerDescription}
                  onChange={(e) => onNewTimerDescriptionChange(e.target.value)}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                  placeholder='Get ready!'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>Target Date & Time</label>
                <input
                  type='datetime-local'
                  value={newTimerDate}
                  onChange={(e) => onNewTimerDateChange(e.target.value)}
                  className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                />
              </div>
              <div className='flex gap-2'>
                <button
                  onClick={onCreateTimer}
                  className='flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg px-4 py-2 text-sm font-semibold transition'
                >
                  {editingTimerId ? 'Update Timer' : 'Create Timer'}
                </button>
                <button
                  onClick={onCancelTimerForm}
                  className='bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 text-sm font-semibold transition'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Timer List */}
          {timers.length === 0 ? (
            <div className='text-center py-8 text-gray-400 text-sm'>
              No timers yet. Create one to countdown to your events!
            </div>
          ) : (
            <div className='space-y-3'>
              {timers.map((timer) => (
                <div
                  key={timer.id}
                  className='bg-gray-700/30 rounded-xl p-4 border border-gray-600'
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='font-semibold text-yellow-400'>{timer.title}</div>
                      {timer.description && (
                        <div className='text-xs text-gray-400 mt-1'>{timer.description}</div>
                      )}
                      <div className='text-xs text-gray-500 mt-2'>
                        {new Date(timer.targetDate).toLocaleString()}
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => onToggleTimer(timer.id, !timer.isActive)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          timer.isActive
                            ? 'bg-green-600 hover:bg-green-500'
                            : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                      >
                        {timer.isActive ? 'Active' : 'Paused'}
                      </button>
                      <button
                        onClick={() => onStartEditingTimer(timer)}
                        className='text-yellow-400 hover:text-yellow-300 transition'
                        title='Edit timer'
                      >
                        <Pencil className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => onDeleteTimer(timer.id)}
                        className='text-red-400 hover:text-red-300 transition'
                        title='Delete timer'
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
                            d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Position & Size Controls */}
          <div className='mt-6 pt-6 border-t border-gray-600'>
            <h4 className='text-sm font-semibold text-gray-300 mb-3'>Position & Size</h4>
            <PositionControls
              x={componentLayouts.countdown.x || 0}
              y={componentLayouts.countdown.y || 0}
              onPositionChange={onPositionChange}
              color='yellow'
              elementWidth={componentLayouts.countdown.minWidth || 320}
              elementHeight={80 * (timers.length || 1)}
              scale={componentLayouts.countdown.scale || 1}
            />
            <div className='grid grid-cols-2 gap-3 mt-3'>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Scale: {(componentLayouts.countdown.scale || 1).toFixed(1)}x
                </label>
                <input
                  type='range'
                  min='0.5'
                  max='2'
                  step='0.1'
                  value={componentLayouts.countdown.scale || 1}
                  onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
                />
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Min Width: {componentLayouts.countdown.minWidth || 320}px
                </label>
                <input
                  type='range'
                  min='250'
                  max='500'
                  step='50'
                  value={componentLayouts.countdown.minWidth || 320}
                  onChange={(e) => onMinWidthChange(parseInt(e.target.value))}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
