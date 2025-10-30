// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { ColorScheme, WeatherEffect, NowPlaying } from '@/types/overlay';

export default function DashboardPage() {
  const { socket, isConnected } = useSocket();

  // Spotify Authentication
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(
    null,
  );

  // Now Playing Form (now automated)
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackAlbumArt, setTrackAlbumArt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  // Scene Layers
  const [layers, setLayers] = useState([
    { id: 'particles', name: 'Particles', visible: true },
    { id: 'weather', name: 'Weather', visible: true },
    { id: 'chat', name: 'Chat', visible: true },
    { id: 'nowplaying', name: 'Now Playing', visible: true },
  ]);

  // Visualizer Configuration
  const [visualizerSize, setVisualizerSize] = useState(1.0);
  const [visualizerX, setVisualizerX] = useState(50);
  const [visualizerY, setVisualizerY] = useState(50);

  // Handle Spotify callback tokens from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      setSpotifyToken(accessToken);
      setSpotifyRefreshToken(refreshToken);
      // Store in localStorage for persistence
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard');
    } else {
      // Try to restore from localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefresh = localStorage.getItem('spotify_refresh_token');
      if (storedToken && storedRefresh) {
        setSpotifyToken(storedToken);
        setSpotifyRefreshToken(storedRefresh);
      }
    }
  }, []);

  // Poll Spotify API for now playing
  useEffect(() => {
    if (!spotifyToken || !socket || !isConnected) return;

    const pollSpotify = async () => {
      try {
        const response = await fetch(
          `/api/spotify/now-playing?access_token=${spotifyToken}`,
        );
        const data = await response.json();

        if (data.isPlaying) {
          const track: NowPlaying = {
            title: data.title,
            artist: data.artist,
            albumArt: data.albumArt,
            isPlaying: data.isPlaying,
            progress: data.progress,
            duration: data.duration,
            timestamp: Date.now(),
          };
          socket.emit('now-playing', track);
          setTrackTitle(data.title);
          setTrackArtist(data.artist);
          setTrackAlbumArt(data.albumArt);
          setIsPlaying(data.isPlaying);
        } else {
          // Send not playing state
          socket.emit('now-playing', {
            title: trackTitle,
            artist: trackArtist,
            albumArt: trackAlbumArt,
            isPlaying: false,
          });
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
      }
    };

    // Poll every 5 seconds
    pollSpotify();
    const interval = setInterval(pollSpotify, 5000);

    return () => clearInterval(interval);
  }, [spotifyToken, socket, isConnected]);

  const changeColorScheme = (scheme: ColorScheme) => {
    if (!socket) return;
    socket.emit('color-scheme-change', scheme);
  };

  const changeWeather = (effect: WeatherEffect) => {
    if (!socket) return;
    socket.emit('weather-change', effect);
  };

  const updateNowPlaying = () => {
    if (!socket) return;

    const track: NowPlaying = {
      title: trackTitle,
      artist: trackArtist,
      albumArt: trackAlbumArt,
      isPlaying,
    };

    socket.emit('now-playing', track);
  };

  const toggleLayer = (layerId: string) => {
    if (!socket) return;

    const layer = layers.find(l => l.id === layerId);
    if (!layer) return;

    const newVisible = !layer.visible;
    setLayers(prev =>
      prev.map(l => (l.id === layerId ? { ...l, visible: newVisible } : l))
    );

    socket.emit('scene-toggle', { layerId, visible: newVisible });
  };

  // Emit visualizer config changes
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('visualizer-config', {
      size: visualizerSize,
      x: visualizerX,
      y: visualizerY,
    });
  }, [socket, isConnected, visualizerSize, visualizerX, visualizerY]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 md:mb-12'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2'>
                Stream Overlay Control
              </h1>
              <p className='text-gray-400 text-sm md:text-base'>
                Configure your live stream visualization in real-time
              </p>
            </div>
            <div className='flex items-center gap-3 bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700'>
              <div
                className={`w-3 h-3 rounded-full ${
                  isConnected
                    ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/50'
                    : 'bg-red-500 animate-pulse shadow-lg shadow-red-500/50'
                }`}
              />
              <span className='text-sm font-semibold'>
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Visualizer Controls */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Visualizer Configuration */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center'>
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
                      d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold'>Visualizer</h2>
              </div>
              <div className='space-y-5'>
                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <label className='text-sm font-medium text-gray-300'>
                      Size
                    </label>
                    <span className='text-sm font-bold text-purple-400'>
                      {visualizerSize.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type='range'
                    min='0.3'
                    max='2.0'
                    step='0.1'
                    value={visualizerSize}
                    onChange={e => setVisualizerSize(Number(e.target.value))}
                    className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
                  />
                </div>
                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <label className='text-sm font-medium text-gray-300'>
                      Horizontal
                    </label>
                    <span className='text-sm font-bold text-blue-400'>
                      {visualizerX}%
                    </span>
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={visualizerX}
                    onChange={e => setVisualizerX(Number(e.target.value))}
                    className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500'
                  />
                </div>
                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <label className='text-sm font-medium text-gray-300'>
                      Vertical
                    </label>
                    <span className='text-sm font-bold text-pink-400'>
                      {visualizerY}%
                    </span>
                  </div>
                  <input
                    type='range'
                    min='0'
                    max='100'
                    value={visualizerY}
                    onChange={e => setVisualizerY(Number(e.target.value))}
                    className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pink-500'
                  />
                </div>
                <button
                  onClick={() => {
                    setVisualizerSize(1.0);
                    setVisualizerX(50);
                    setVisualizerY(50);
                  }}
                  className='w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-xl px-4 py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600'
                >
                  Reset Position
                </button>
              </div>
            </div>
          </div>

          {/* Middle Column - Color & Effects */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Color Schemes */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center'>
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
                      d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold'>Color Scheme</h2>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {(
                  [
                    'default',
                    'gaming',
                    'chill',
                    'energetic',
                    'dark',
                    'neon',
                  ] as ColorScheme[]
                ).map(scheme => (
                  <button
                    key={scheme}
                    onClick={() => changeColorScheme(scheme)}
                    className='group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 rounded-xl px-4 py-4 font-semibold capitalize transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg hover:shadow-xl overflow-hidden'
                  >
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
                    {scheme}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Effects */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center'>
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
                      d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold'>Weather Effects</h2>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {(['none', 'rain', 'snow', 'confetti'] as WeatherEffect[]).map(
                  effect => (
                    <button
                      key={effect}
                      onClick={() => changeWeather(effect)}
                      className='group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 rounded-xl px-4 py-4 font-semibold capitalize transition-all duration-200 border border-gray-600 hover:border-gray-500 shadow-lg hover:shadow-xl overflow-hidden'
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
                      {effect}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Scene Layers */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center'>
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
                      d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold'>Scene Layers</h2>
              </div>
              <div className='grid grid-cols-2 gap-3'>
                {layers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`relative rounded-xl px-4 py-4 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border ${
                      layer.visible
                        ? 'bg-gradient-to-br from-green-600/80 to-emerald-600/80 border-green-500 hover:from-green-500/80 hover:to-emerald-500/80'
                        : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border-gray-600 hover:from-gray-600/50 hover:to-gray-700/50'
                    }`}
                  >
                    <div className='flex flex-col items-center gap-1'>
                      <span>{layer.name}</span>
                      <span className='text-xs opacity-75'>
                        {layer.visible ? '👁️ Visible' : '🚫 Hidden'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Spotify */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Now Playing */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center'>
                  <svg
                    className='w-6 h-6'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
                  </svg>
                </div>
                <h2 className='text-xl font-bold'>Spotify</h2>
              </div>

              {!spotifyToken ? (
                <div className='text-center py-6'>
                  <div className='mb-4 text-gray-300'>
                    Connect your Spotify account to display what you&apos;re
                    listening to
                  </div>
                  <a
                    href='/api/spotify/login'
                    className='inline-block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl px-8 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-xl'
                  >
                    Connect Spotify
                  </a>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-2 h-2 rounded-full bg-green-400 animate-pulse' />
                      <span className='text-xs text-gray-400'>
                        Auto-updating every 5s
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSpotifyToken(null);
                        setSpotifyRefreshToken(null);
                        localStorage.removeItem('spotify_access_token');
                        localStorage.removeItem('spotify_refresh_token');
                      }}
                      className='text-xs text-red-400 hover:text-red-300 transition'
                    >
                      Disconnect
                    </button>
                  </div>

                  {trackTitle && (
                    <div className='bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-4 border border-gray-600'>
                      <div className='flex items-center gap-4'>
                        {trackAlbumArt && (
                          <img
                            src={trackAlbumArt}
                            alt='Album art'
                            className='w-20 h-20 rounded-lg shadow-lg'
                          />
                        )}
                        <div className='flex-1 min-w-0'>
                          <div className='font-bold text-white truncate'>
                            {trackTitle}
                          </div>
                          <div className='text-sm text-gray-400 truncate'>
                            {trackArtist}
                          </div>
                          <div className='flex items-center gap-2 mt-2'>
                            {isPlaying ? (
                              <div className='flex items-center gap-1 text-xs text-green-400'>
                                <div className='w-1 h-3 bg-green-400 rounded animate-pulse' />
                                <div className='w-1 h-4 bg-green-400 rounded animate-pulse delay-75' />
                                <div className='w-1 h-2 bg-green-400 rounded animate-pulse delay-150' />
                                <span className='ml-1'>Playing</span>
                              </div>
                            ) : (
                              <div className='text-xs text-gray-500'>
                                Paused
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Manual Override */}
                  <details className='group'>
                    <summary className='cursor-pointer text-xs text-gray-400 hover:text-gray-300 transition list-none flex items-center gap-2'>
                      <svg
                        className='w-4 h-4 transition-transform group-open:rotate-90'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M9 5l7 7-7 7'
                        />
                      </svg>
                      Manual Override
                    </summary>
                    <div className='mt-4 space-y-3'>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Track Title
                        </label>
                        <input
                          type='text'
                          value={trackTitle}
                          onChange={e => setTrackTitle(e.target.value)}
                          className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:outline-none'
                          placeholder='Song name'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Artist
                        </label>
                        <input
                          type='text'
                          value={trackArtist}
                          onChange={e => setTrackArtist(e.target.value)}
                          className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:outline-none'
                          placeholder='Artist name'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Album Art URL
                        </label>
                        <input
                          type='text'
                          value={trackAlbumArt}
                          onChange={e => setTrackAlbumArt(e.target.value)}
                          className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-gray-500 focus:outline-none'
                          placeholder='https://...'
                        />
                      </div>
                      <label className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={isPlaying}
                          onChange={e => setIsPlaying(e.target.checked)}
                          className='w-4 h-4 accent-green-500'
                        />
                        <span className='text-sm text-gray-300'>
                          Currently Playing
                        </span>
                      </label>
                      <button
                        onClick={updateNowPlaying}
                        className='w-full bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 shadow-lg hover:shadow-xl border border-gray-600'
                      >
                        Update Manually
                      </button>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
