// components/dashboard/expanded/EmoteWallExpanded.tsx
'use client';

interface EmoteWallExpandedProps {
  emoteInput: string;
  emoteIntensity: 'light' | 'medium' | 'heavy';
  isConnected: boolean;
  onEmoteInputChange: (value: string) => void;
  onIntensityChange: (intensity: 'light' | 'medium' | 'heavy') => void;
  onTrigger: () => void;
  onClose: () => void;
}

export default function EmoteWallExpanded({
  emoteInput,
  emoteIntensity,
  isConnected,
  onEmoteInputChange,
  onIntensityChange,
  onTrigger,
  onClose,
}: EmoteWallExpandedProps) {
  return (
    <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
      <div className='flex items-center gap-3 mb-6'>
        <button
          onClick={onClose}
          className='w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white'
          aria-label='Back'
        >
          <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </button>
        <div className='w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center'>
          <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <h2 className='text-xl font-bold'>Emote Wall</h2>
      </div>

      <div className='space-y-4'>
        <div>
          <label className='block text-sm text-gray-300 mb-2'>Emotes (space-separated)</label>
          <input
            type='text'
            value={emoteInput}
            onChange={(e) => onEmoteInputChange(e.target.value)}
            className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:outline-none'
            placeholder='🎉 🎊 ✨ 🌟 💫'
          />
          <p className='text-xs text-gray-500 mt-1'>Use emoji or paste emote URLs</p>
        </div>

        <div>
          <label className='block text-sm text-gray-300 mb-2'>Intensity</label>
          <div className='grid grid-cols-3 gap-2'>
            {(['light', 'medium', 'heavy'] as const).map((intensity) => (
              <button
                key={intensity}
                onClick={() => onIntensityChange(intensity)}
                className={`py-2 rounded-lg text-sm font-semibold capitalize transition ${
                  emoteIntensity === intensity
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 border-pink-500'
                    : 'bg-gray-700/50 border-gray-600 hover:bg-gray-600/50'
                } border`}
              >
                {intensity}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onTrigger}
          disabled={!isConnected}
          className='w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl px-6 py-4 font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl'
        >
          {isConnected ? '🎉 Trigger Emote Wall! 🎉' : 'Not Connected'}
        </button>
      </div>
    </div>
  );
}
