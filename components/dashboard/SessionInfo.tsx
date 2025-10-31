// components/dashboard/SessionInfo.tsx
'use client';

interface SessionInfoProps {
  sessionId: string;
  isAuthenticated: boolean;
}

export default function SessionInfo({ sessionId, isAuthenticated }: SessionInfoProps) {
  return (
    <div className='mt-6 bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <div className='text-xs text-gray-400 mb-1'>Your Joe-verlay Session</div>
          <div className='text-lg font-bold text-purple-300'>{sessionId}</div>
          <div className='text-xs text-gray-500 mt-1'>
            {isAuthenticated
              ? 'Your settings are auto-saved ✓'
              : 'Sign in with Twitch to save your settings'}
          </div>
        </div>
        <div className='flex-1'>
          <div className='text-xs text-gray-400 mb-1'>OBS Browser Source URL</div>
          <div className='flex gap-2'>
            <input
              type='text'
              value={`${window.location.origin}/overlay/${sessionId}`}
              readOnly
              className='flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none'
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  `${window.location.origin}/overlay/${sessionId}`
                );
              }}
              className='bg-purple-600 hover:bg-purple-500 rounded-lg px-4 py-2 text-sm font-semibold transition'
            >
              Copy
            </button>
          </div>
          <div className='text-xs text-gray-500 mt-1'>
            Width: 1920 × Height: 1080 × FPS: 60
          </div>
        </div>
      </div>
    </div>
  );
}
