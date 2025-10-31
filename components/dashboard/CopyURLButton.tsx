// components/dashboard/CopyURLButton.tsx
'use client';

import { useState } from 'react';

interface CopyURLButtonProps {
  url: string;
  label?: string;
}

export default function CopyURLButton({
  url,
  label = 'Copy OBS URL',
}: CopyURLButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className='mt-6 pt-4 border-t border-gray-700/50'>
      <div className='flex items-center gap-3'>
        <div className='flex-1'>
          <div className='text-xs text-gray-400 mb-1'>
            Individual Element URL
          </div>
          <div className='text-xs font-mono text-gray-500 truncate bg-gray-800/50 rounded px-2 py-1 border border-gray-700/50'>
            {url}
          </div>
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            copied
              ? 'bg-green-600 hover:bg-green-500'
              : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400'
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
              {label}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
