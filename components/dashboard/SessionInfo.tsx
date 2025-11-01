// components/dashboard/SessionInfo.tsx
'use client';

import { useState } from 'react';

interface SessionInfoProps {
  sessionId: string;
  isAuthenticated: boolean;
}

export default function SessionInfo({
  sessionId,
  isAuthenticated,
}: SessionInfoProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/overlay/${sessionId}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className='mt-6 bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30'>
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <div>
          <div className='text-xs text-gray-400 mb-1'>
            Your Joe-verlay Session
          </div>
          <div className='text-lg font-bold text-purple-300'>{sessionId}</div>
          <div className='text-xs text-gray-500 mt-1'>
            {isAuthenticated
              ? 'Your settings are auto-saved ✓'
              : 'Sign in with Twitch to save your settings'}
          </div>
        </div>
        <div className='flex-1'>
          <div className='text-xs text-gray-400 mb-1'>
            OBS Browser Source URL
          </div>
          <div className='flex gap-2'>
            <input
              type='text'
              value={`${window.location.origin}/overlay/${sessionId}`}
              readOnly
              className='flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none'
            />
            <button
              onClick={handleCopy}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                copied
                  ? 'bg-green-600 hover:bg-green-500 scale-105 shadow-lg shadow-green-500/50'
                  : 'bg-purple-600 hover:bg-purple-500 hover:scale-105'
              }`}
            >
              {copied ? (
                <>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                  Copy
                </>
              )}
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
