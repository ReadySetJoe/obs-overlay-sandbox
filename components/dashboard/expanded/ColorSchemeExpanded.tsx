// components/dashboard/expanded/ColorSchemeExpanded.tsx
'use client';

import { useState } from 'react';
import {
  ColorScheme,
  ColorSchemeCategory,
  CustomColors,
} from '@/types/overlay';
import {
  colorSchemePresets,
  getColorSchemesByCategory,
  categoryInfo,
} from '@/lib/colorSchemes';
import ColorPicker from '../ColorPicker';
import GradientSelector from '../GradientSelector';

interface ColorSchemeExpandedProps {
  colorScheme: ColorScheme;
  customColors: CustomColors | null;
  onColorSchemeChange: (scheme: ColorScheme) => void;
  onCustomColorsChange: (colors: CustomColors) => void;
  onClose: () => void;
}

export default function ColorSchemeExpanded({
  colorScheme,
  customColors,
  onColorSchemeChange,
  onCustomColorsChange,
  onClose,
}: ColorSchemeExpandedProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ColorSchemeCategory>('all');
  const [showCustomBuilder, setShowCustomBuilder] = useState(
    colorScheme === 'custom'
  );

  const filteredPresets = getColorSchemesByCategory(selectedCategory);

  const currentCustomColors: CustomColors = customColors || {
    primary: '#1e3a8a',
    secondary: '#581c87',
    accent: '#7c3aed',
    gradientType: 'linear',
    gradientDirection: 'to-br',
  };

  const handleCustomColorChange = (updatedColors: CustomColors) => {
    onCustomColorsChange(updatedColors);
    if (colorScheme !== 'custom') {
      onColorSchemeChange('custom');
    }
  };

  // Generate preview gradient for custom colors (match overlay rendering)
  const customGradientPreview = (() => {
    if (currentCustomColors.gradientType === 'linear') {
      // Use degrees for consistency with overlay (better OBS compatibility)
      const directionMap: Record<string, string> = {
        'to-r': '90deg',
        'to-l': '270deg',
        'to-t': '0deg',
        'to-b': '180deg',
        'to-tr': '45deg',
        'to-tl': '315deg',
        'to-br': '135deg',
        'to-bl': '225deg',
      };
      const direction =
        directionMap[currentCustomColors.gradientDirection] || '135deg';
      return `linear-gradient(${direction}, ${currentCustomColors.primary}, ${currentCustomColors.secondary})`;
    } else {
      return `radial-gradient(circle, ${currentCustomColors.primary}, ${currentCustomColors.secondary})`;
    }
  })();

  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl max-h-[90vh] overflow-y-auto'>
      {/* Header */}
      <div className='flex items-center gap-3 mb-6 top-0 bg-gray-800/95 backdrop-blur-sm -mx-6 -mt-6 px-6 py-4 border-b border-gray-700/50 z-10'>
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
          🎨
        </div>
        <h2 className='text-xl font-bold'>Color Schemes</h2>
      </div>

      {/* Category Filter */}
      <div className='mb-6'>
        <h3 className='text-sm font-semibold text-gray-400 mb-3'>CATEGORIES</h3>
        <div className='flex flex-wrap gap-2'>
          {(Object.keys(categoryInfo) as ColorSchemeCategory[]).map(
            category => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  if (category === 'custom') {
                    setShowCustomBuilder(true);
                  } else {
                    setShowCustomBuilder(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{categoryInfo[category].icon}</span>
                <span>{categoryInfo[category].name}</span>
              </button>
            )
          )}
        </div>
        <p className='text-xs text-gray-500 mt-2'>
          {categoryInfo[selectedCategory].description}
        </p>
      </div>

      {/* Custom Color Builder */}
      {showCustomBuilder ? (
        <div className='space-y-6'>
          <div className='bg-purple-900/20 border border-purple-500/30 rounded-xl p-4'>
            <h3 className='text-lg font-bold text-purple-400 mb-2'>
              Custom Color Builder
            </h3>
            <p className='text-sm text-gray-400'>
              Create your own color scheme by selecting colors and gradient
              settings
            </p>
          </div>

          {/* Live Preview */}
          <div>
            <h4 className='text-sm font-semibold text-gray-300 mb-2'>
              Live Preview
            </h4>
            <div
              className='w-full h-32 rounded-xl border-2 border-gray-600 shadow-lg'
              style={{ background: customGradientPreview }}
            />
          </div>

          {/* Color Pickers */}
          <ColorPicker
            label='Primary Color'
            description='Main background color'
            color={currentCustomColors.primary}
            onChange={color =>
              handleCustomColorChange({
                ...currentCustomColors,
                primary: color,
              })
            }
          />

          <ColorPicker
            label='Secondary Color'
            description='Gradient end color'
            color={currentCustomColors.secondary}
            onChange={color =>
              handleCustomColorChange({
                ...currentCustomColors,
                secondary: color,
              })
            }
          />

          <ColorPicker
            label='Accent Color'
            description='Highlight and accent color'
            color={currentCustomColors.accent}
            onChange={color =>
              handleCustomColorChange({ ...currentCustomColors, accent: color })
            }
          />

          {/* Gradient Settings */}
          <GradientSelector
            customColors={currentCustomColors}
            onChange={handleCustomColorChange}
          />

          {/* Apply Button */}
          <button
            onClick={() => {
              // Always emit custom colors to force overlay update
              handleCustomColorChange(currentCustomColors);
            }}
            className='w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl'
          >
            Apply Custom Colors
          </button>
        </div>
      ) : (
        /* Preset Color Schemes */
        <div>
          <h3 className='text-sm font-semibold text-gray-400 mb-3'>
            PRESETS ({filteredPresets.length})
          </h3>
          <div className='grid grid-cols-2 gap-3'>
            {filteredPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => onColorSchemeChange(preset.id)}
                className={`group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 rounded-xl overflow-hidden border shadow-lg hover:shadow-xl transition-all duration-200 ${
                  colorScheme === preset.id
                    ? 'border-purple-500 ring-2 ring-purple-500/50'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                {/* Gradient Preview */}
                <div
                  className={`w-full h-20 bg-gradient-${preset.gradient}`}
                  style={{
                    background: `linear-gradient(to bottom right, ${preset.preview.primary}40, ${preset.preview.secondary}40)`,
                  }}
                />

                {/* Info */}
                <div className='p-3'>
                  <div className='font-bold text-white mb-1'>{preset.name}</div>
                  <div className='text-xs text-gray-400'>
                    {preset.description}
                  </div>

                  {/* Color Swatches */}
                  <div className='flex gap-1 mt-2'>
                    <div
                      className='w-6 h-6 rounded-md border border-gray-600'
                      style={{ backgroundColor: preset.preview.primary }}
                      title='Primary'
                    />
                    <div
                      className='w-6 h-6 rounded-md border border-gray-600'
                      style={{ backgroundColor: preset.preview.secondary }}
                      title='Secondary'
                    />
                    <div
                      className='w-6 h-6 rounded-md border border-gray-600'
                      style={{ backgroundColor: preset.preview.accent }}
                      title='Accent'
                    />
                  </div>
                </div>

                {/* Hover effect */}
                <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none' />

                {/* Selected indicator */}
                {colorScheme === preset.id && (
                  <div className='absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-4 h-4 text-white'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={3}
                        d='M5 13l4 4L19 7'
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
