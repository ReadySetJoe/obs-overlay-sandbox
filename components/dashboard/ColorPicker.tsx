// components/dashboard/ColorPicker.tsx
'use client';

import { useState } from 'react';

interface ColorPickerProps {
  label: string;
  color: string;
  onChange: (color: string) => void;
  description?: string;
}

export default function ColorPicker({ label, color, onChange, description }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    onChange(newColor);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const presetColors = [
    // Reds
    '#EF4444', '#DC2626', '#B91C1C', '#991B1B',
    // Oranges
    '#F97316', '#EA580C', '#C2410C', '#9A3412',
    // Yellows
    '#EAB308', '#CA8A04', '#A16207', '#854D0E',
    // Greens
    '#22C55E', '#16A34A', '#15803D', '#166534',
    // Teals
    '#14B8A6', '#0D9488', '#0F766E', '#115E59',
    // Blues
    '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
    // Purples
    '#A855F7', '#9333EA', '#7E22CE', '#6B21A8',
    // Pinks
    '#EC4899', '#DB2777', '#BE185D', '#9F1239',
    // Grays
    '#6B7280', '#4B5563', '#374151', '#1F2937',
  ];

  return (
    <div className='space-y-2'>
      <div className='flex items-center justify-between'>
        <div>
          <label className='block text-sm font-semibold text-gray-300'>{label}</label>
          {description && <p className='text-xs text-gray-500 mt-0.5'>{description}</p>}
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white transition'
        >
          {isOpen ? 'Hide' : 'Show'} Picker
        </button>
      </div>

      <div className='flex items-center gap-3'>
        {/* Color preview box */}
        <div
          className='w-16 h-10 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition shadow-lg'
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(!isOpen)}
        />

        {/* Hex input */}
        <input
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          placeholder='#000000'
          className='flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm font-mono text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50'
          maxLength={7}
        />

        {/* Native color picker */}
        <input
          type='color'
          value={color}
          onChange={(e) => handleColorChange(e.target.value)}
          className='w-10 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:border-gray-500 transition'
        />
      </div>

      {/* Preset colors palette */}
      {isOpen && (
        <div className='grid grid-cols-9 gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700'>
          {presetColors.map((presetColor) => (
            <button
              key={presetColor}
              onClick={() => handleColorChange(presetColor)}
              className={`w-8 h-8 rounded-md hover:scale-110 transition-transform ${
                color.toUpperCase() === presetColor.toUpperCase()
                  ? 'ring-2 ring-white scale-110'
                  : ''
              }`}
              style={{ backgroundColor: presetColor }}
              title={presetColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}
