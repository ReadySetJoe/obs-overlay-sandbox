// components/dashboard/expanded/WheelExpanded.tsx
'use client';

import { useState } from 'react';
import { WheelConfig, WheelSegment, ComponentLayouts } from '@/types/overlay';
import CopyURLButton from '../CopyURLButton';
import { Plus, Trash2, Play, CircleDot } from 'lucide-react';
import { WheelIcon } from '../tiles/TileIcons';
import { useOverlayUrl } from '@/hooks/useOriginUrl';

interface WheelExpandedProps {
  sessionId: string;
  wheels: WheelConfig[];
  isVisible: boolean;
  componentLayouts: ComponentLayouts;
  onToggleVisibility: () => void;
  onPositionChange: (
    position: 'center' | 'top-center' | 'bottom-center'
  ) => void;
  onScaleChange: (scale: number) => void;
  onCreateWheel: (wheel: Omit<WheelConfig, 'id' | 'layoutId'>) => void;
  onUpdateWheel: (wheelId: string, updates: Partial<WheelConfig>) => void;
  onDeleteWheel: (wheelId: string) => void;
  onSpinWheel: (wheelId: string) => void;
  onClose: () => void;
}

const DEFAULT_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
  '#52B788',
];

export default function WheelExpanded({
  sessionId,
  wheels,
  isVisible,
  componentLayouts,
  onToggleVisibility,
  onPositionChange,
  onScaleChange,
  onCreateWheel,
  onUpdateWheel,
  onDeleteWheel,
  onSpinWheel,
  onClose,
}: WheelExpandedProps) {
  const [showWheelForm, setShowWheelForm] = useState(false);
  const [editingWheelId, setEditingWheelId] = useState<string | null>(null);
  const [wheelName, setWheelName] = useState('');
  const [segments, setSegments] = useState<WheelSegment[]>([
    { label: 'Option 1', color: DEFAULT_COLORS[0], weight: 1 },
    { label: 'Option 2', color: DEFAULT_COLORS[1], weight: 1 },
  ]);
  const [spinDuration, setSpinDuration] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundVolume, setSoundVolume] = useState(0.7);

  const activeWheel = wheels.find(w => w.isActive);
  const wheelLayout = componentLayouts.wheel || {
    position: 'center',
    scale: 1.0,
  };

  const handleShowWheelForm = () => {
    setShowWheelForm(true);
    setEditingWheelId(null);
    setWheelName('');
    setSegments([
      { label: 'Option 1', color: DEFAULT_COLORS[0], weight: 1 },
      { label: 'Option 2', color: DEFAULT_COLORS[1], weight: 1 },
    ]);
    setSpinDuration(5);
    setSoundEnabled(true);
    setSoundVolume(0.7);
  };

  const handleEditWheel = (wheel: WheelConfig) => {
    setShowWheelForm(true);
    setEditingWheelId(wheel.id);
    setWheelName(wheel.name);
    setSegments(wheel.segments);
    setSpinDuration(wheel.spinDuration);
    setSoundEnabled(wheel.soundEnabled);
    setSoundVolume(wheel.soundVolume);
  };

  const handleCancelForm = () => {
    setShowWheelForm(false);
    setEditingWheelId(null);
  };

  const handleSaveWheel = () => {
    if (!wheelName.trim() || segments.length < 2) {
      alert('Please provide a name and at least 2 segments');
      return;
    }

    // Validate segments
    for (const segment of segments) {
      if (!segment.label.trim()) {
        alert('All segments must have a label');
        return;
      }
    }

    if (editingWheelId) {
      // Update existing wheel
      onUpdateWheel(editingWheelId, {
        name: wheelName,
        segments,
        spinDuration,
        soundEnabled,
        soundVolume,
      });
    } else {
      // Create new wheel
      onCreateWheel({
        name: wheelName,
        segments,
        isActive: false,
        position: wheelLayout.position,
        scale: wheelLayout.scale,
        spinDuration,
        soundEnabled,
        soundVolume,
      });
    }

    handleCancelForm();
  };

  const handleAddSegment = () => {
    const colorIndex = segments.length % DEFAULT_COLORS.length;
    setSegments([
      ...segments,
      {
        label: `Option ${segments.length + 1}`,
        color: DEFAULT_COLORS[colorIndex],
        weight: 1,
      },
    ]);
  };

  const handleRemoveSegment = (index: number) => {
    if (segments.length <= 2) {
      alert('A wheel must have at least 2 segments');
      return;
    }
    setSegments(segments.filter((_, i) => i !== index));
  };

  const handleUpdateSegment = (
    index: number,
    updates: Partial<WheelSegment>
  ) => {
    setSegments(
      segments.map((seg, i) => (i === index ? { ...seg, ...updates } : seg))
    );
  };

  const handleSetActiveWheel = (wheelId: string) => {
    onUpdateWheel(wheelId, { isActive: true });
  };

  return (
    <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
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
          <WheelIcon />
          <h2 className='text-xl font-bold'>Wheel Spinner</h2>
        </div>
        <button
          onClick={onToggleVisibility}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            isVisible
              ? 'bg-cyan-600 hover:bg-cyan-500'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {isVisible ? '👁️ Visible' : '🚫 Hidden'}
        </button>
      </div>

      {/* Wheel list */}
      {!showWheelForm && (
        <div className='space-y-4'>
          <div className='flex justify-between items-center'>
            <h3 className='text-lg font-semibold'>Your Wheels</h3>
            <button
              onClick={handleShowWheelForm}
              className='flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors'
            >
              <Plus className='w-4 h-4' />
              Create Wheel
            </button>
          </div>

          {wheels.length === 0 ? (
            <div className='text-center py-8 text-gray-400'>
              <CircleDot className='w-12 h-12 mx-auto mb-3 opacity-50' />
              <p>No wheels created yet</p>
              <p className='text-sm'>Create your first wheel to get started!</p>
            </div>
          ) : (
            <div className='space-y-3'>
              {wheels.map(wheel => (
                <div
                  key={wheel.id}
                  className={`p-4 rounded-lg border ${
                    wheel.isActive
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center gap-2 mb-2'>
                        <h4 className='font-semibold'>{wheel.name}</h4>
                        {wheel.isActive && (
                          <span className='text-xs px-2 py-1 bg-purple-600 rounded-full'>
                            Active
                          </span>
                        )}
                      </div>
                      <div className='flex flex-wrap gap-1 mb-2'>
                        {wheel.segments.slice(0, 5).map((seg, i) => (
                          <span
                            key={i}
                            className='text-xs px-2 py-1 rounded'
                            style={{
                              backgroundColor: seg.color,
                              color: '#fff',
                            }}
                          >
                            {seg.label}
                          </span>
                        ))}
                        {wheel.segments.length > 5 && (
                          <span className='text-xs px-2 py-1 bg-gray-700 rounded'>
                            +{wheel.segments.length - 5} more
                          </span>
                        )}
                      </div>
                      <p className='text-sm text-gray-400'>
                        {wheel.segments.length} segments • {wheel.spinDuration}s
                        spin
                      </p>
                    </div>
                    <div className='flex gap-2'>
                      {!wheel.isActive ? (
                        <button
                          onClick={() => handleSetActiveWheel(wheel.id)}
                          className='px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors'
                        >
                          Activate
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => onSpinWheel(wheel.id)}
                            className='px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded transition-colors flex items-center gap-1'
                          >
                            <Play className='w-3 h-3' />
                            Spin
                          </button>
                          <button
                            onClick={() =>
                              onUpdateWheel(wheel.id, { isActive: false })
                            }
                            className='px-3 py-1 text-sm bg-orange-600 hover:bg-orange-700 rounded transition-colors'
                          >
                            Deactivate
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEditWheel(wheel)}
                        className='px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete wheel "${wheel.name}"?`)) {
                            onDeleteWheel(wheel.id);
                          }
                        }}
                        className='px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors'
                      >
                        <Trash2 className='w-3 h-3' />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Position controls */}
          {activeWheel && (
            <div className='mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700'>
              <h3 className='text-sm font-semibold mb-4'>
                Active Wheel Settings
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Position
                  </label>
                  <select
                    value={wheelLayout.position}
                    onChange={e =>
                      onPositionChange(
                        e.target.value as
                          | 'center'
                          | 'top-center'
                          | 'bottom-center'
                      )
                    }
                    className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg'
                  >
                    <option value='center'>Center</option>
                    <option value='top-center'>Top Center</option>
                    <option value='bottom-center'>Bottom Center</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Scale: {wheelLayout.scale.toFixed(1)}x
                  </label>
                  <input
                    type='range'
                    min='0.5'
                    max='2'
                    step='0.1'
                    value={wheelLayout.scale}
                    onChange={e => onScaleChange(parseFloat(e.target.value))}
                    className='w-full'
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Wheel form */}
      {showWheelForm && (
        <div className='space-y-4'>
          <h3 className='text-lg font-semibold'>
            {editingWheelId ? 'Edit Wheel' : 'Create New Wheel'}
          </h3>

          <div>
            <label className='block text-sm font-medium mb-2'>Wheel Name</label>
            <input
              type='text'
              value={wheelName}
              onChange={e => setWheelName(e.target.value)}
              placeholder='e.g., Giveaway Wheel, Game Selector'
              className='w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg'
            />
          </div>

          <div>
            <div className='flex justify-between items-center mb-2'>
              <label className='block text-sm font-medium'>
                Segments (min 2)
              </label>
              <button
                onClick={handleAddSegment}
                className='text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1'
              >
                <Plus className='w-4 h-4' />
                Add Segment
              </button>
            </div>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {segments.map((segment, index) => (
                <div key={index} className='flex gap-2 items-center'>
                  <input
                    type='color'
                    value={segment.color}
                    onChange={e =>
                      handleUpdateSegment(index, { color: e.target.value })
                    }
                    className='w-12 h-10 rounded cursor-pointer'
                  />
                  <input
                    type='text'
                    value={segment.label}
                    onChange={e =>
                      handleUpdateSegment(index, { label: e.target.value })
                    }
                    placeholder='Label'
                    className='flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg'
                  />
                  <input
                    type='number'
                    value={segment.weight || 1}
                    onChange={e =>
                      handleUpdateSegment(index, {
                        weight: parseInt(e.target.value) || 1,
                      })
                    }
                    min='1'
                    max='10'
                    className='w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg'
                    title='Weight (1-10)'
                  />
                  <button
                    onClick={() => handleRemoveSegment(index)}
                    className='p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded'
                    disabled={segments.length <= 2}
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              ))}
            </div>
            <p className='text-xs text-gray-400 mt-1'>
              Weight determines probability (higher = more likely to land)
            </p>
          </div>

          <div>
            <label className='block text-sm font-medium mb-2'>
              Spin Duration: {spinDuration}s
            </label>
            <input
              type='range'
              min='3'
              max='10'
              step='1'
              value={spinDuration}
              onChange={e => setSpinDuration(parseInt(e.target.value))}
              className='w-full'
            />
          </div>

          <div className='flex items-center gap-4'>
            <label className='flex items-center gap-2 cursor-pointer'>
              <input
                type='checkbox'
                checked={soundEnabled}
                onChange={e => setSoundEnabled(e.target.checked)}
                className='w-4 h-4'
              />
              <span className='text-sm'>Enable Sound</span>
            </label>
            {soundEnabled && (
              <div className='flex-1'>
                <label className='block text-sm font-medium mb-1'>
                  Volume: {Math.round(soundVolume * 100)}%
                </label>
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.1'
                  value={soundVolume}
                  onChange={e => setSoundVolume(parseFloat(e.target.value))}
                  className='w-full'
                />
              </div>
            )}
          </div>

          <div className='flex gap-3 pt-4'>
            <button
              onClick={handleSaveWheel}
              className='flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors'
            >
              {editingWheelId ? 'Update Wheel' : 'Create Wheel'}
            </button>
            <button
              onClick={handleCancelForm}
              className='px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors'
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Copy URL */}
      <CopyURLButton
        url={useOverlayUrl(sessionId, 'wheel')}
        label='Wheel Overlay URL'
      />
    </div>
  );
}
