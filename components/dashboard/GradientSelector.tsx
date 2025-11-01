// components/dashboard/GradientSelector.tsx
'use client';

import { CustomColors } from '@/types/overlay';

interface GradientSelectorProps {
  customColors: CustomColors;
  onChange: (customColors: CustomColors) => void;
}

export default function GradientSelector({ customColors, onChange }: GradientSelectorProps) {
  const gradientTypes: Array<{ value: CustomColors['gradientType']; label: string; icon: string }> = [
    { value: 'linear', label: 'Linear', icon: '→' },
    { value: 'radial', label: 'Radial', icon: '◉' },
  ];

  const gradientDirections: Array<{
    value: CustomColors['gradientDirection'];
    label: string;
    icon: string;
  }> = [
    { value: 'to-r', label: 'Right', icon: '→' },
    { value: 'to-l', label: 'Left', icon: '←' },
    { value: 'to-t', label: 'Up', icon: '↑' },
    { value: 'to-b', label: 'Down', icon: '↓' },
    { value: 'to-tr', label: 'Top Right', icon: '↗' },
    { value: 'to-tl', label: 'Top Left', icon: '↖' },
    { value: 'to-br', label: 'Bottom Right', icon: '↘' },
    { value: 'to-bl', label: 'Bottom Left', icon: '↙' },
  ];

  return (
    <div className='space-y-4'>
      {/* Gradient Type */}
      <div>
        <label className='block text-sm font-semibold text-gray-300 mb-2'>Gradient Type</label>
        <div className='grid grid-cols-2 gap-2'>
          {gradientTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => onChange({ ...customColors, gradientType: type.value })}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                customColors.gradientType === type.value
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className='flex items-center justify-center gap-2'>
                <span className='text-xl'>{type.icon}</span>
                <span>{type.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Gradient Direction (only for linear) */}
      {customColors.gradientType === 'linear' && (
        <div>
          <label className='block text-sm font-semibold text-gray-300 mb-2'>
            Gradient Direction
          </label>
          <div className='grid grid-cols-4 gap-2'>
            {gradientDirections.map((direction) => (
              <button
                key={direction.value}
                onClick={() => onChange({ ...customColors, gradientDirection: direction.value })}
                className={`px-3 py-3 rounded-lg font-medium transition-all ${
                  customColors.gradientDirection === direction.value
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                title={direction.label}
              >
                <div className='flex flex-col items-center gap-1'>
                  <span className='text-2xl'>{direction.icon}</span>
                  <span className='text-xs'>{direction.label.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
