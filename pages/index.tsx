// pages/index.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import Head from 'next/head';
import Footer from '@/components/Footer';
import UserProfileDropdown from '@/components/UserProfileDropdown';
import Image from 'next/image';

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
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
    <>
      <Head>
        <title>Joeverlay - Dynamic Stream Overlays for Twitch and OBS</title>
      </Head>
      <div className='min-h-screen bg-linear-to-br from-purple-900 via-blue-900 to-gray-900 text-white flex items-center justify-center p-4'>
        <div className='max-w-2xl w-full'>
          {/* User Profile Dropdown */}
          <div className='absolute top-2 right-2'>
            <UserProfileDropdown />
          </div>

          {/* Hero Section */}
          <div className='text-center mb-12'>
            <div className='my-8'>
              <Image
                src='/title.png'
                alt='Joe-verlay'
                className='mx-auto mb-4 max-w-md md:max-w-2xl w-full'
                width={500}
                height={200}
              />
            </div>
            <p className='text-xl text-gray-300 mb-2'>
              Professional stream overlays for Twitch and OBS
            </p>
            <p className='text-sm text-gray-400'>
              Real-time chat highlights, music integration, timers, and
              interactive effects
            </p>
          </div>

          {/* Twitch Login CTA */}
          {!session && (
            <div className='mb-8 bg-linear-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30'>
              <div className='flex items-center justify-between flex-col md:flex-row gap-4'>
                <div className='text-center md:text-left'>
                  <h3 className='text-lg font-bold mb-1'>
                    Sign in to get started
                  </h3>
                  <p className='text-sm text-gray-400'>
                    Use your Twitch account to create and join overlay sessions
                  </p>
                </div>
                <button
                  onClick={() => signIn('twitch')}
                  className='bg-purple-600 hover:bg-purple-500 rounded-xl px-6 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2'
                >
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z' />
                  </svg>
                  Sign in with Twitch
                </button>
              </div>
            </div>
          )}

          {/* Action Cards */}
          {session && (
            <div className='grid md:grid-cols-2 gap-6 mb-8'>
              {/* Create New Session */}
              <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105'>
                <div className='mb-4'>
                  <div className='w-12 h-12 bg-linear-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4'>
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
                  <h2 className='text-2xl font-bold mb-2'>Create Session</h2>
                  <p className='text-gray-400 text-sm mb-6'>
                    Get your own Joe-verlay with a unique session ID
                  </p>
                </div>
                <button
                  onClick={createNewSession}
                  className='w-full bg-linear-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-xl px-6 py-4 font-bold transition-all duration-200 shadow-lg hover:shadow-xl'
                >
                  Create Session
                </button>
              </div>

              {/* Join Existing Session */}
              <div className='bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105'>
                <div className='mb-4'>
                  <div className='w-12 h-12 bg-linear-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4'>
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
                  <h2 className='text-2xl font-bold mb-2'>Join Session</h2>
                  <p className='text-gray-400 text-sm mb-6'>
                    Enter your friend&apos;s session ID to access their
                    Joe-verlay
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
                    className='w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl px-6 py-4 font-bold transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none'
                  >
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          <div className='bg-linear-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30'>
            <h3 className='text-lg font-bold mb-4 text-center'>Features</h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm'>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>🎨</div>
                <div>Paint by Numbers</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Interactive canvas
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>📐</div>
                <div>Layouts</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Drag & position
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>💬</div>
                <div>Chat Highlights</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Twitch chat integration
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>🎧</div>
                <div>Now Playing</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Spotify integration
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>⏱️</div>
                <div>Countdown Timers</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Multiple timers
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>🎨</div>
                <div>Custom Colors</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Presets + builder
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>🌧️</div>
                <div>Weather Overlay</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Particle effects
                </div>
              </div>
              <div className='text-gray-300'>
                <div className='text-2xl mb-1'>🎭</div>
                <div>Emote Wall</div>
                <div className='text-xs text-gray-500 mt-1'>
                  Floating emojis
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
}
