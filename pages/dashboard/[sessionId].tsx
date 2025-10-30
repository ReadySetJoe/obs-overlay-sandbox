// pages/dashboard/[sessionId].tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer';
import { ColorScheme, WeatherEffect, NowPlaying } from '@/types/overlay';

export default function DashboardPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket(sessionId as string);
  const {
    audioLevel,
    frequencyData,
    isListening,
    startListening,
    stopListening,
  } = useAudioAnalyzer();

  // Save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    'saved'
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Spotify Authentication
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(
    null
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

  // Overlay settings
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('none');
  const [customColors, setCustomColors] = useState<string[]>([
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
  ]); // [bass, mid, treble]

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
      // Clean URL - preserve sessionId
      const cleanUrl = sessionId
        ? `/dashboard/${sessionId}`
        : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else {
      // Try to restore from localStorage
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefresh = localStorage.getItem('spotify_refresh_token');
      if (storedToken && storedRefresh) {
        setSpotifyToken(storedToken);
        setSpotifyRefreshToken(storedRefresh);
      }
    }
  }, [sessionId]);

  // Load saved layout when user is authenticated
  useEffect(() => {
    if (!session || !sessionId) return;

    const loadLayout = async () => {
      try {
        const response = await fetch(
          `/api/layouts/load?sessionId=${sessionId}`
        );
        if (response.ok) {
          const { layout } = await response.json();

          // Restore settings from saved layout
          setVisualizerSize(layout.visualizerSize);
          setVisualizerX(layout.visualizerX);
          setVisualizerY(layout.visualizerY);
          setColorScheme(layout.colorScheme);
          setWeatherEffect(layout.weatherEffect);
          if (layout.customColors) {
            setCustomColors(JSON.parse(layout.customColors));
          }
          setLayers([
            {
              id: 'particles',
              name: 'Particles',
              visible: layout.particlesVisible,
            },
            {
              id: 'weather',
              name: 'Weather',
              visible: layout.weatherVisible,
            },
            { id: 'chat', name: 'Chat', visible: layout.chatVisible },
            {
              id: 'nowplaying',
              name: 'Now Playing',
              visible: layout.nowPlayingVisible,
            },
          ]);

          setLastSaved(new Date(layout.updatedAt));
          console.log('Layout loaded successfully');
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      }
    };

    loadLayout();
  }, [session, sessionId]);

  // Auto-save layout when settings change
  const saveLayout = useCallback(async () => {
    if (!session || !sessionId) return;

    setSaveStatus('saving');

    try {
      const response = await fetch('/api/layouts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          visualizerSize,
          visualizerX,
          visualizerY,
          colorScheme,
          weatherEffect,
          customColors: JSON.stringify(customColors),
          layers,
        }),
      });

      if (response.ok) {
        setSaveStatus('saved');
        setLastSaved(new Date());
      } else {
        setSaveStatus('unsaved');
      }
    } catch (error) {
      console.error('Error saving layout:', error);
      setSaveStatus('unsaved');
    }
  }, [
    session,
    sessionId,
    visualizerSize,
    visualizerX,
    visualizerY,
    colorScheme,
    weatherEffect,
    layers,
  ]);

  // Debounced auto-save
  useEffect(() => {
    if (!session) return;

    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      saveLayout();
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timer);
  }, [
    session,
    visualizerSize,
    visualizerX,
    visualizerY,
    colorScheme,
    weatherEffect,
    customColors,
    layers,
    saveLayout,
  ]);

  // Poll Spotify API for now playing
  useEffect(() => {
    if (!spotifyToken || !socket || !isConnected) return;

    const pollSpotify = async () => {
      try {
        const response = await fetch(
          `/api/spotify/now-playing?access_token=${spotifyToken}`
        );

        // If token expired (401), try to refresh
        if (response.status === 401 && spotifyRefreshToken) {
          console.log('Spotify token expired, refreshing...');
          try {
            const refreshResponse = await fetch(
              `/api/spotify/refresh?refresh_token=${spotifyRefreshToken}`
            );
            const refreshData = await refreshResponse.json();

            if (refreshResponse.ok) {
              // Update tokens
              setSpotifyToken(refreshData.access_token);
              localStorage.setItem(
                'spotify_access_token',
                refreshData.access_token
              );
              console.log('Spotify token refreshed successfully');
              return; // Will retry on next poll with new token
            }
          } catch (refreshError) {
            console.error('Error refreshing Spotify token:', refreshError);
            return;
          }
        }

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
  }, [spotifyToken, socket, isConnected, spotifyRefreshToken]);

  const changeColorScheme = (scheme: ColorScheme) => {
    if (!socket) return;
    setColorScheme(scheme);
    socket.emit('color-scheme-change', scheme);
    // Also emit custom colors if switching to custom scheme
    if (scheme === 'custom') {
      socket.emit('custom-colors-change', customColors);
    }
  };

  const updateCustomColors = (colors: string[]) => {
    if (!socket) return;
    setCustomColors(colors);
    // Only emit if we're currently on custom scheme
    if (colorScheme === 'custom') {
      socket.emit('custom-colors-change', colors);
    }
  };

  const changeWeather = (effect: WeatherEffect) => {
    if (!socket) return;
    setWeatherEffect(effect);
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

  // Auto-start audio listening
  useEffect(() => {
    if (!isListening) {
      startListening();
    }
  }, []);

  // Store latest audio data in refs so the broadcast loop can access current values
  const audioLevelRef = useRef(audioLevel);
  const frequencyDataRef = useRef(frequencyData);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
    frequencyDataRef.current = frequencyData;
  }, [audioLevel, frequencyData]);

  // Broadcast audio data to overlay via socket
  useEffect(() => {
    if (!socket || !isConnected || !isListening) return;

    // Use setInterval instead of requestAnimationFrame
    // setInterval is less throttled in background tabs
    const interval = setInterval(() => {
      socket.emit('audio-data', {
        audioLevel: audioLevelRef.current,
        frequencyData: {
          bass: frequencyDataRef.current.bass,
          lowMid: frequencyDataRef.current.lowMid,
          mid: frequencyDataRef.current.mid,
          highMid: frequencyDataRef.current.highMid,
          treble: frequencyDataRef.current.treble,
          overall: frequencyDataRef.current.overall,
          // Convert Uint8Array to regular array for transmission
          frequencies: Array.from(frequencyDataRef.current.frequencies),
        },
      });
    }, 16); // ~60fps (16ms)

    return () => clearInterval(interval);
  }, [socket, isConnected, isListening]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8 md:mb-12'>
          <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
            <div>
              <h1 className='text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2'>
                Joe-verlay Control
              </h1>
              <p className='text-gray-400 text-sm md:text-base'>
                Configure your audio-reactive overlay in real-time
              </p>
            </div>
            <div className='flex items-center gap-3'>
              {/* Audio Broadcasting Status */}
              {isListening && (
                <div className='bg-purple-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-purple-700'>
                  <div className='flex items-center gap-2'>
                    <div className='flex items-center gap-1'>
                      <div className='w-1 h-3 bg-purple-400 rounded animate-pulse' />
                      <div className='w-1 h-4 bg-purple-400 rounded animate-pulse delay-75' />
                      <div className='w-1 h-2 bg-purple-400 rounded animate-pulse delay-150' />
                    </div>
                    <span className='text-sm font-semibold text-purple-300'>
                      Broadcasting
                    </span>
                  </div>
                </div>
              )}

              {/* Save Status */}
              {session && (
                <div className='bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700'>
                  <div className='flex items-center gap-2'>
                    {saveStatus === 'saved' && (
                      <>
                        <svg
                          className='w-4 h-4 text-green-400'
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
                        <span className='text-sm text-green-400'>Saved</span>
                      </>
                    )}
                    {saveStatus === 'saving' && (
                      <>
                        <div className='w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin' />
                        <span className='text-sm text-blue-400'>Saving...</span>
                      </>
                    )}
                    {saveStatus === 'unsaved' && (
                      <>
                        <div className='w-2 h-2 bg-yellow-400 rounded-full' />
                        <span className='text-sm text-yellow-400'>Unsaved</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Connection Status */}
              <div className='bg-gray-800/50 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-700'>
                <div className='flex items-center gap-2'>
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
          </div>

          {/* Session Info */}
          {sessionId && (
            <div className='mt-6 bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30'>
              <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
                <div>
                  <div className='text-xs text-gray-400 mb-1'>
                    Your Joe-verlay Session
                  </div>
                  <div className='text-lg font-bold text-purple-300'>
                    {sessionId}
                  </div>
                  <div className='text-xs text-gray-500 mt-1'>
                    {session
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

              {/* OBS Audio Setup Instructions */}
              <details className='mt-4 bg-blue-900/20 rounded-xl p-4 border border-blue-500/30'>
                <summary className='cursor-pointer text-sm font-semibold text-blue-300 flex items-center gap-2'>
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
                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  🎧 Setup Audio for Visualizer (CLICK ME!)
                </summary>
                <div className='mt-4 space-y-4 text-sm text-gray-200'>
                  <div className='bg-purple-900/30 rounded-lg p-3 border border-purple-500/50 mb-4'>
                    <p className='text-sm text-purple-200'>
                      <strong>How it works:</strong> The{' '}
                      <span className='text-yellow-300'>dashboard</span>{' '}
                      captures your audio and sends it to the{' '}
                      <span className='text-green-300'>overlay</span> in
                      real-time.
                    </p>
                    <p className='text-xs text-yellow-300 mt-2 font-semibold'>
                      ⚠️ Keep this dashboard tab visible/active while streaming
                      - browsers throttle background tabs!
                    </p>
                  </div>

                  {/* Step 1 */}
                  <div className='bg-gray-800/70 rounded-lg p-4 border-l-4 border-green-500'>
                    <p className='font-bold text-green-300 mb-2'>
                      STEP 1: Install BlackHole (Mac only)
                    </p>
                    <ol className='list-decimal list-inside space-y-1 text-xs ml-2'>
                      <li>
                        Download{' '}
                        <a
                          href='https://existential.audio/blackhole/'
                          target='_blank'
                          className='text-blue-400 hover:underline font-semibold'
                        >
                          BlackHole 2ch
                        </a>
                      </li>
                      <li>Install it (standard Mac installer)</li>
                      <li>Restart your Mac if prompted</li>
                    </ol>
                  </div>

                  {/* Step 2 */}
                  <div className='bg-gray-800/70 rounded-lg p-4 border-l-4 border-blue-500'>
                    <p className='font-bold text-blue-300 mb-2'>
                      STEP 2: Setup Audio MIDI
                    </p>
                    <ol className='list-decimal list-inside space-y-2 text-xs ml-2'>
                      <li>
                        Open{' '}
                        <span className='font-semibold text-yellow-300'>
                          Audio MIDI Setup
                        </span>{' '}
                        (Cmd+Space, type "Audio MIDI")
                      </li>
                      <li>
                        Click the <span className='font-semibold'>+</span>{' '}
                        button at bottom left
                      </li>
                      <li>
                        Select{' '}
                        <span className='font-semibold text-yellow-300'>
                          "Create Multi-Output Device"
                        </span>
                      </li>
                      <li>
                        Check BOTH boxes:
                        <ul className='list-disc list-inside ml-4 mt-1'>
                          <li>✅ Your normal speakers/headphones</li>
                          <li>✅ BlackHole 2ch</li>
                        </ul>
                      </li>
                      <li>
                        Right-click the Multi-Output Device →{' '}
                        <span className='font-semibold text-yellow-300'>
                          "Use This Device For Sound Output"
                        </span>
                      </li>
                    </ol>
                    <p className='mt-2 text-yellow-200 text-xs'>
                      💡 Now your audio plays through BOTH your speakers AND
                      BlackHole
                    </p>
                  </div>

                  {/* Step 3 - THIS DASHBOARD */}
                  <div className='bg-gray-800/70 rounded-lg p-4 border-l-4 border-pink-500'>
                    <p className='font-bold text-pink-300 mb-2'>
                      STEP 3: Enable Audio on THIS Dashboard
                    </p>
                    <ol className='list-decimal list-inside space-y-2 text-xs ml-2'>
                      <li>
                        Look for the browser permission prompt (usually top-left
                        or in URL bar)
                      </li>
                      <li>
                        Click{' '}
                        <span className='font-semibold text-yellow-300'>
                          "Allow"
                        </span>{' '}
                        when asked for microphone access
                      </li>
                      <li>
                        In the device selector, choose{' '}
                        <span className='font-semibold text-green-300'>
                          BlackHole 2ch
                        </span>
                      </li>
                      <li>
                        Play some music and verify this dashboard is capturing
                        audio
                      </li>
                    </ol>
                    <p className='mt-2 text-yellow-200 text-xs'>
                      💡 Keep this dashboard tab visible/active while streaming
                      - it's sending audio data to your overlay! Browsers
                      heavily throttle hidden tabs.
                    </p>
                  </div>

                  {/* Step 4 */}
                  <div className='bg-gray-800/70 rounded-lg p-4 border-l-4 border-orange-500'>
                    <p className='font-bold text-orange-300 mb-2'>
                      STEP 4: Add Overlay to OBS
                    </p>
                    <ol className='list-decimal list-inside space-y-2 text-xs ml-2'>
                      <li>
                        In OBS, add a{' '}
                        <span className='font-semibold text-yellow-300'>
                          Browser Source
                        </span>
                      </li>
                      <li>Paste the overlay URL from above</li>
                      <li>
                        Set Width: <span className='font-semibold'>1920</span>,
                        Height: <span className='font-semibold'>1080</span>
                      </li>
                      <li>Click OK - no special audio settings needed!</li>
                    </ol>
                    <p className='mt-2 text-yellow-200 text-xs'>
                      💡 The overlay receives audio data from this dashboard via
                      the internet
                    </p>
                  </div>

                  <div className='bg-green-900/30 rounded-lg p-3 border border-green-500/50 text-center'>
                    <p className='font-bold text-green-300 mb-1'>
                      🎉 Done! The visualizer should now react to your music!
                    </p>
                    <p className='text-xs text-yellow-200 font-semibold'>
                      ⚠️ Keep this dashboard tab visible/active while streaming
                    </p>
                  </div>

                  <div className='bg-red-900/30 rounded-lg p-3 border border-red-500/50'>
                    <p className='font-bold text-red-300 mb-2'>
                      Troubleshooting
                    </p>
                    <ul className='text-xs space-y-1 text-gray-300'>
                      <li>
                        • Make sure music is playing and this dashboard is open
                      </li>
                      <li>
                        • Check System Preferences → Security & Privacy →
                        Microphone → Allow your browser
                      </li>
                      <li>
                        • Refresh the microphone permission by clicking the 🔒
                        or camera icon in your browser's URL bar
                      </li>
                      <li>
                        • Make sure you selected BlackHole 2ch (not your Mac's
                        built-in mic)
                      </li>
                      <li>
                        • Verify the Multi-Output Device is set as your sound
                        output in System Preferences
                      </li>
                    </ul>
                  </div>
                </div>
              </details>
            </div>
          )}
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
                    'custom',
                  ] as ColorScheme[]
                ).map(scheme => (
                  <button
                    key={scheme}
                    onClick={() => changeColorScheme(scheme)}
                    className={`group relative bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 rounded-xl px-4 py-4 font-semibold capitalize transition-all duration-200 border shadow-lg hover:shadow-xl overflow-hidden ${
                      colorScheme === scheme
                        ? 'border-purple-500 ring-2 ring-purple-500/50'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
                    {scheme}
                  </button>
                ))}
              </div>

              {/* Custom Color Pickers */}
              {colorScheme === 'custom' && (
                <div className='mt-4 bg-gray-700/30 rounded-xl p-4 border border-gray-600'>
                  <p className='text-sm font-semibold text-gray-300 mb-3'>
                    Custom Colors
                  </p>
                  <div className='space-y-3'>
                    {/* Bass Color */}
                    <div className='flex items-center gap-3'>
                      <label className='text-xs text-gray-400 w-16'>Bass</label>
                      <input
                        type='color'
                        value={customColors[0]}
                        onChange={e =>
                          updateCustomColors([
                            e.target.value,
                            customColors[1],
                            customColors[2],
                          ])
                        }
                        className='w-12 h-8 rounded border border-gray-600 cursor-pointer'
                      />
                      <input
                        type='text'
                        value={customColors[0]}
                        onChange={e =>
                          updateCustomColors([
                            e.target.value,
                            customColors[1],
                            customColors[2],
                          ])
                        }
                        className='flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500'
                        placeholder='#3b82f6'
                      />
                    </div>

                    {/* Mid Color */}
                    <div className='flex items-center gap-3'>
                      <label className='text-xs text-gray-400 w-16'>Mid</label>
                      <input
                        type='color'
                        value={customColors[1]}
                        onChange={e =>
                          updateCustomColors([
                            customColors[0],
                            e.target.value,
                            customColors[2],
                          ])
                        }
                        className='w-12 h-8 rounded border border-gray-600 cursor-pointer'
                      />
                      <input
                        type='text'
                        value={customColors[1]}
                        onChange={e =>
                          updateCustomColors([
                            customColors[0],
                            e.target.value,
                            customColors[2],
                          ])
                        }
                        className='flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500'
                        placeholder='#8b5cf6'
                      />
                    </div>

                    {/* Treble Color */}
                    <div className='flex items-center gap-3'>
                      <label className='text-xs text-gray-400 w-16'>Treble</label>
                      <input
                        type='color'
                        value={customColors[2]}
                        onChange={e =>
                          updateCustomColors([
                            customColors[0],
                            customColors[1],
                            e.target.value,
                          ])
                        }
                        className='w-12 h-8 rounded border border-gray-600 cursor-pointer'
                      />
                      <input
                        type='text'
                        value={customColors[2]}
                        onChange={e =>
                          updateCustomColors([
                            customColors[0],
                            customColors[1],
                            e.target.value,
                          ])
                        }
                        className='flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-300 focus:outline-none focus:border-purple-500'
                        placeholder='#ec4899'
                      />
                    </div>
                  </div>
                </div>
              )}
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
                    href={`/api/spotify/login?sessionId=${sessionId}`}
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
