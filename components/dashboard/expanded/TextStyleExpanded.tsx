import { useState } from 'react';
import { TextStyleIcon } from '../tiles/TileIcons';

const AVAILABLE_FONTS = [
  { name: 'Inter', category: 'Modern', description: 'Clean and professional' },
  {
    name: 'Poppins',
    category: 'Modern',
    description: 'Playful and rounded',
  },
  { name: 'Roboto', category: 'Modern', description: 'Classic and readable' },
  {
    name: 'Montserrat',
    category: 'Modern',
    description: 'Strong and bold',
  },
  {
    name: 'Bebas Neue',
    category: 'Display',
    description: 'Bold uppercase',
  },
  {
    name: 'Orbitron',
    category: 'Gaming',
    description: 'Futuristic sci-fi',
  },
  {
    name: 'Press Start 2P',
    category: 'Gaming',
    description: 'Retro pixel',
  },
  { name: 'Righteous', category: 'Display', description: 'Bold and fun' },
  { name: 'Bangers', category: 'Display', description: 'Comic book style' },
  {
    name: 'Permanent Marker',
    category: 'Casual',
    description: 'Handwritten',
  },
  { name: 'Pacifico', category: 'Casual', description: 'Surf and casual' },
  { name: 'Anton', category: 'Display', description: 'Impact display' },
  {
    name: 'Archivo Black',
    category: 'Display',
    description: 'Heavy and modern',
  },
  { name: 'Fredoka', category: 'Modern', description: 'Friendly rounded' },
  { name: 'Titan One', category: 'Display', description: 'Playful thick' },
];

interface TextStyleExpandedProps {
  fontFamily: string;
  onFontFamilyChange: (font: string) => void;
  onClose: () => void;
}

export default function TextStyleExpanded({
  fontFamily,
  onFontFamilyChange,
  onClose,
}: TextStyleExpandedProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredFonts = AVAILABLE_FONTS.filter(
    font => selectedCategory === 'All' || font.category === selectedCategory
  );

  return (
    <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl max-h-[90vh] overflow-y-auto'>
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
        <TextStyleIcon />
        <h2 className='text-xl font-bold'>Text Style</h2>
      </div>

      <div className='mb-4'>
        <label className='block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300'>
          Filter by Category
        </label>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className='w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'
        >
          <option value='All'>All</option>
          <option value='Modern'>Modern</option>
          <option value='Display'>Display</option>
          <option value='Gaming'>Gaming</option>
          <option value='Casual'>Casual</option>
        </select>
      </div>

      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto'>
        {filteredFonts.map(font => (
          <div
            key={font.name}
            className={`p-4 border rounded-md cursor-pointer hover:shadow-md ${
              fontFamily === font.name
                ? 'border-blue-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
            onClick={() => onFontFamilyChange(font.name)}
          >
            <h3
              className={`text-lg font-medium mb-1 ${
                fontFamily === font.name
                  ? 'text-blue-600'
                  : 'text-gray-800 dark:text-gray-200'
              }`}
              style={{ fontFamily: font.name }}
            >
              {font.name}
            </h3>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              {font.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
