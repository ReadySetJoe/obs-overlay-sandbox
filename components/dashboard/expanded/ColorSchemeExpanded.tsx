// components/dashboard/expanded/ColorSchemeExpanded.tsx
'use client';

import { ColorScheme } from '@/types/overlay';

interface ColorSchemeExpandedProps {
  colorScheme: ColorScheme;
  onColorSchemeChange: (scheme: ColorScheme) => void;
}

export default function ColorSchemeExpanded({
  colorScheme,
  onColorSchemeChange,
}: ColorSchemeExpandedProps) {
  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
            />
          </svg>
        </div>
        <h2 className='text-xl font-bold'>Color Scheme</h2>
      </div>
      <div className='grid grid-cols-2 gap-3'>
        {(['default', 'gaming', 'chill', 'energetic', 'dark', 'neon'] as ColorScheme[]).map(
          (scheme) => (
            <button
              key={scheme}
              onClick={() => onColorSchemeChange(scheme)}
              className={`group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 rounded-xl px-4 py-4 font-semibold capitalize transition-all duration-200 border shadow-lg hover:shadow-xl overflow-hidden ${
                colorScheme === scheme
                  ? 'border-purple-500 ring-2 ring-purple-500/50'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
              {scheme}
            </button>
          )
        )}
      </div>
    </div>
  );
}
