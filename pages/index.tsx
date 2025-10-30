// pages/index.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';

export default function HomePage() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');

  const generateSessionId = () => {
    // Generate a random 6-character session ID
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  };

  const createNewSession = () => {
    const newSessionId = generateSessionId();
    router.push(`/dashboard/${newSessionId}`);
  };

  const joinSession = () => {
    if (sessionId.trim()) {
      router.push(`/dashboard/${sessionId.trim().toLowerCase()}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      joinSession();
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white flex items-center justify-center p-4'>
      <div className='max-w-2xl w-full'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <div className='mb-6'>
            <div className='inline-block p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl shadow-2xl mb-6'>
              <svg
                className='w-16 h-16'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                />
              </svg>
            </div>
          </div>
          <h1 className='text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent'>
            Stream Overlay
          </h1>
          <p className='text-xl text-gray-300 mb-2'>
            Audio-reactive visualizations for your streams
          </p>
          <p className='text-sm text-gray-400'>
            Create your own session and share with friends
          </p>
        </div>

        {/* Action Cards */}
        <div className='grid md:grid-cols-2 gap-6 mb-8'>
          {/* Create New Session */}
          <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105'>
            <div className='mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 4v16m8-8H4'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold mb-2'>Create New</h2>
              <p className='text-gray-400 text-sm mb-6'>
                Start a new session with a unique ID
              </p>
            </div>
            <button
              onClick={createNewSession}
              className='w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl px-6 py-4 font-bold transition-all duration-200 shadow-lg hover:shadow-xl'
            >
              Create Session
            </button>
          </div>

          {/* Join Existing Session */}
          <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105'>
            <div className='mb-4'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4'>
                <svg
                  className='w-6 h-6'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1'
                  />
                </svg>
              </div>
              <h2 className='text-2xl font-bold mb-2'>Join Existing</h2>
              <p className='text-gray-400 text-sm mb-6'>
                Enter a session ID to join
              </p>
            </div>
            <div className='space-y-3'>
              <input
                type='text'
                value={sessionId}
                onChange={e => setSessionId(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder='Enter session ID'
                className='w-full bg-gray-700/50 border border-gray-600 rounded-xl px-4 py-3 focus:border-blue-500 focus:outline-none transition-colors'
              />
              <button
                onClick={joinSession}
                disabled={!sessionId.trim()}
                className='w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl px-6 py-4 font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none'
              >
                Join Session
              </button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className='bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30'>
          <h3 className='text-lg font-bold mb-4 text-center'>Features</h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm'>
            <div className='text-gray-300'>
              <div className='text-2xl mb-1'>🎵</div>
              <div>Audio Reactive</div>
            </div>
            <div className='text-gray-300'>
              <div className='text-2xl mb-1'>🎨</div>
              <div>Color Schemes</div>
            </div>
            <div className='text-gray-300'>
              <div className='text-2xl mb-1'>☁️</div>
              <div>Weather Effects</div>
            </div>
            <div className='text-gray-300'>
              <div className='text-2xl mb-1'>🎧</div>
              <div>Spotify Integration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
