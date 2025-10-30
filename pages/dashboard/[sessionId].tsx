// pages/dashboard/[sessionId].tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import {
  ColorScheme,
  WeatherEffect,
  NowPlaying,
  CountdownTimer,
  EmoteWallConfig,
  ComponentLayouts,
} from '@/types/overlay';
import PositionControls from '@/components/dashboard/PositionControls';
import { Pencil } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket(sessionId as string);

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
    { id: 'weather', name: 'Weather', visible: true },
    { id: 'chat', name: 'Chat', visible: true },
    { id: 'nowplaying', name: 'Now Playing', visible: true },
    { id: 'countdown', name: 'Countdown', visible: true },
  ]);

  // Overlay settings
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('none');

  // Countdown timers
  const [timers, setTimers] = useState<CountdownTimer[]>([]);
  const [showTimerForm, setShowTimerForm] = useState(false);
  const [editingTimerId, setEditingTimerId] = useState<string | null>(null);
  const [newTimerTitle, setNewTimerTitle] = useState('');
  const [newTimerDescription, setNewTimerDescription] = useState('');
  const [newTimerDate, setNewTimerDate] = useState('');

  // Emote wall
  const [emoteInput, setEmoteInput] = useState('🎉 🎊 ✨ 🌟 💫');
  const [emoteIntensity, setEmoteIntensity] = useState<'light' | 'medium' | 'heavy'>('medium');

  // Component layouts
  const [componentLayouts, setComponentLayouts] = useState<ComponentLayouts>({
    chat: { position: 'top-left', x: 0, y: 80, maxWidth: 400 },
    nowPlaying: { position: 'top-left', x: 0, y: 0, width: 400, scale: 1 },
    countdown: { position: 'top-left', x: 0, y: 0, scale: 1, minWidth: 320 },
    weather: { density: 1 },
  });

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
          setColorScheme(layout.colorScheme);
          setWeatherEffect(layout.weatherEffect);
          setLayers([
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
            {
              id: 'countdown',
              name: 'Countdown',
              visible: layout.countdownVisible,
            },
          ]);

          // Load component layouts
          if (layout.componentLayouts) {
            try {
              const parsedLayouts = JSON.parse(layout.componentLayouts);
              setComponentLayouts(parsedLayouts);
            } catch (error) {
              console.error('Error parsing component layouts:', error);
            }
          }

          setLastSaved(new Date(layout.updatedAt));
          console.log('Layout loaded successfully');
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      }
    };

    loadLayout();
  }, [session, sessionId]);

  // Load timers when session is ready
  useEffect(() => {
    if (!session || !sessionId) return;

    const loadTimers = async () => {
      try {
        const response = await fetch(`/api/timers/list?sessionId=${sessionId}`);
        if (response.ok) {
          const { timers } = await response.json();
          setTimers(timers);
        }
      } catch (error) {
        console.error('Error loading timers:', error);
      }
    };

    loadTimers();
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
          colorScheme,
          weatherEffect,
          layers,
          componentLayouts: JSON.stringify(componentLayouts),
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
  }, [session, sessionId, colorScheme, weatherEffect, layers, componentLayouts]);

  // Debounced auto-save
  useEffect(() => {
    if (!session) return;

    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      saveLayout();
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(timer);
  }, [session, colorScheme, weatherEffect, layers, componentLayouts, saveLayout]);

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

  // Emit timers to overlay when they change
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('countdown-timers', timers);
  }, [socket, isConnected, timers]);

  // Emit component layouts to overlay when they change
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('component-layouts', componentLayouts);
  }, [socket, isConnected, componentLayouts]);

  const startEditingTimer = (timer: CountdownTimer) => {
    setEditingTimerId(timer.id);
    setNewTimerTitle(timer.title);
    setNewTimerDescription(timer.description || '');
    setNewTimerDate(new Date(timer.targetDate).toISOString().slice(0, 16));
    setShowTimerForm(true);
  };

  const cancelTimerForm = () => {
    setShowTimerForm(false);
    setEditingTimerId(null);
    setNewTimerTitle('');
    setNewTimerDescription('');
    setNewTimerDate('');
  };

  const createTimer = async () => {
    if (!session || !sessionId || !newTimerTitle || !newTimerDate) return;

    try {
      if (editingTimerId) {
        // Update existing timer
        const response = await fetch(`/api/timers/${editingTimerId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTimerTitle,
            description: newTimerDescription,
            targetDate: new Date(newTimerDate).toISOString(),
          }),
        });

        if (response.ok) {
          const { timer } = await response.json();
          setTimers(prev => prev.map(t => t.id === editingTimerId ? timer : t));
          cancelTimerForm();
        }
      } else {
        // Create new timer
        const response = await fetch('/api/timers/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            title: newTimerTitle,
            description: newTimerDescription,
            targetDate: new Date(newTimerDate).toISOString(),
          }),
        });

        if (response.ok) {
          const { timer } = await response.json();
          setTimers(prev => [...prev, timer]);
          cancelTimerForm();
        }
      }
    } catch (error) {
      console.error('Error saving timer:', error);
    }
  };

  const deleteTimer = async (timerId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/timers/${timerId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setTimers(prev => prev.filter(t => t.id !== timerId));
      }
    } catch (error) {
      console.error('Error deleting timer:', error);
    }
  };

  const toggleTimer = async (timerId: string, isActive: boolean) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/timers/${timerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });

      if (response.ok) {
        const { timer } = await response.json();
        setTimers(prev =>
          prev.map(t => (t.id === timerId ? timer : t))
        );
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
    }
  };

  const triggerEmoteWall = () => {
    if (!socket || !isConnected) return;

    const emotes = emoteInput.split(/\s+/).filter(e => e.trim());
    const config: EmoteWallConfig = {
      emotes,
      duration: 10000, // 10 seconds
      intensity: emoteIntensity,
    };

    socket.emit('emote-wall', config);
  };

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
                Configure your stream overlay in real-time
              </p>
            </div>
            <div className='flex items-center gap-3'>
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
            </div>
          )}
        </div>

        {/* Main Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Left Column - Color & Effects */}
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
                  ['default', 'gaming', 'chill', 'energetic', 'dark', 'neon'] as ColorScheme[]
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
            </div>

            {/* Weather Effects */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
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
                <button
                  onClick={() => toggleLayer('weather')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    layers.find(l => l.id === 'weather')?.visible
                      ? 'bg-cyan-600 hover:bg-cyan-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {layers.find(l => l.id === 'weather')?.visible ? '👁️ Visible' : '🚫 Hidden'}
                </button>
              </div>
              <div className='grid grid-cols-2 gap-3 mb-6'>
                {(['none', 'rain', 'snow', 'confetti'] as WeatherEffect[]).map(
                  effect => (
                    <button
                      key={effect}
                      onClick={() => changeWeather(effect)}
                      className={`group relative rounded-xl px-4 py-4 font-semibold capitalize transition-all duration-200 shadow-lg hover:shadow-xl overflow-hidden border ${
                        weatherEffect === effect
                          ? 'bg-gradient-to-br from-cyan-600/80 to-blue-600/80 border-cyan-500'
                          : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 hover:from-gray-600/50 hover:to-gray-700/50 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000' />
                      {effect}
                    </button>
                  )
                )}
              </div>
              <div>
                <label className='block text-xs text-gray-400 mb-1'>
                  Particle Density: {(componentLayouts.weather.density || 1).toFixed(1)}x
                </label>
                <input
                  type='range'
                  min='0.5'
                  max='2'
                  step='0.1'
                  value={componentLayouts.weather.density || 1}
                  onChange={e => setComponentLayouts({
                    ...componentLayouts,
                    weather: { ...componentLayouts.weather, density: parseFloat(e.target.value) }
                  })}
                  className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500'
                />
              </div>
            </div>

          </div>

          {/* Middle Column - Timers & Fun Stuff */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Countdown Timers */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center'>
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
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <h2 className='text-xl font-bold'>Countdown Timers</h2>
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => toggleLayer('countdown')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                      layers.find(l => l.id === 'countdown')?.visible
                        ? 'bg-yellow-600 hover:bg-yellow-500'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    {layers.find(l => l.id === 'countdown')?.visible ? '👁️ Visible' : '🚫 Hidden'}
                  </button>
                  {session && !showTimerForm && (
                    <button
                      onClick={() => setShowTimerForm(!showTimerForm)}
                      className='bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg px-4 py-2 text-sm font-semibold transition'
                    >
                      + Add Timer
                    </button>
                  )}
                </div>
              </div>

              {!session ? (
                <div className='text-center py-4 text-gray-400 text-sm'>
                  Sign in with Twitch to create countdown timers
                </div>
              ) : (
                <>
                  {/* Timer Form */}
                  {showTimerForm && (
                    <div className='mb-6 bg-gray-700/30 rounded-xl p-4 border border-gray-600 space-y-3'>
                      <h3 className='text-sm font-semibold text-yellow-400 mb-3'>
                        {editingTimerId ? 'Edit Timer' : 'Create New Timer'}
                      </h3>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Event Title
                        </label>
                        <input
                          type='text'
                          value={newTimerTitle}
                          onChange={e => setNewTimerTitle(e.target.value)}
                          className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                          placeholder='Stream starts, Tournament begins...'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Description (optional)
                        </label>
                        <input
                          type='text'
                          value={newTimerDescription}
                          onChange={e => setNewTimerDescription(e.target.value)}
                          className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                          placeholder='Get ready!'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Target Date & Time
                        </label>
                        <input
                          type='datetime-local'
                          value={newTimerDate}
                          onChange={e => setNewTimerDate(e.target.value)}
                          className='w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-yellow-500 focus:outline-none'
                        />
                      </div>
                      <div className='flex gap-2'>
                        <button
                          onClick={createTimer}
                          className='flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 rounded-lg px-4 py-2 text-sm font-semibold transition'
                        >
                          {editingTimerId ? 'Update Timer' : 'Create Timer'}
                        </button>
                        <button
                          onClick={cancelTimerForm}
                          className='bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 text-sm font-semibold transition'
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Timer List */}
                  {timers.length === 0 ? (
                    <div className='text-center py-8 text-gray-400 text-sm'>
                      No timers yet. Create one to countdown to your events!
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      {timers.map(timer => (
                        <div
                          key={timer.id}
                          className='bg-gray-700/30 rounded-xl p-4 border border-gray-600'
                        >
                          <div className='flex items-start justify-between'>
                            <div className='flex-1'>
                              <div className='font-semibold text-yellow-400'>
                                {timer.title}
                              </div>
                              {timer.description && (
                                <div className='text-xs text-gray-400 mt-1'>
                                  {timer.description}
                                </div>
                              )}
                              <div className='text-xs text-gray-500 mt-2'>
                                {new Date(timer.targetDate).toLocaleString()}
                              </div>
                            </div>
                            <div className='flex items-center gap-2'>
                              <button
                                onClick={() =>
                                  toggleTimer(timer.id, !timer.isActive)
                                }
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                  timer.isActive
                                    ? 'bg-green-600 hover:bg-green-500'
                                    : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {timer.isActive ? 'Active' : 'Paused'}
                              </button>
                              <button
                                onClick={() => startEditingTimer(timer)}
                                className='text-yellow-400 hover:text-yellow-300 transition'
                                title='Edit timer'
                              >
                                <Pencil className='w-4 h-4' />
                              </button>
                              <button
                                onClick={() => deleteTimer(timer.id)}
                                className='text-red-400 hover:text-red-300 transition'
                                title='Delete timer'
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
                                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Position & Size Controls */}
                  <div className='mt-6 pt-6 border-t border-gray-600'>
                    <h4 className='text-sm font-semibold text-gray-300 mb-3'>Position & Size</h4>
                    <PositionControls
                      x={componentLayouts.countdown.x || 0}
                      y={componentLayouts.countdown.y || 0}
                      onPositionChange={(x, y) => setComponentLayouts({
                        ...componentLayouts,
                        countdown: { ...componentLayouts.countdown, position: 'top-left', x, y }
                      })}
                      color='yellow'
                      elementWidth={componentLayouts.countdown.minWidth || 320}
                      elementHeight={80 * (timers.length || 1)}
                      scale={componentLayouts.countdown.scale || 1}
                    />
                    <div className='grid grid-cols-2 gap-3 mt-3'>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Scale: {(componentLayouts.countdown.scale || 1).toFixed(1)}x
                        </label>
                        <input
                          type='range'
                          min='0.5'
                          max='2'
                          step='0.1'
                          value={componentLayouts.countdown.scale || 1}
                          onChange={e => setComponentLayouts({
                            ...componentLayouts,
                            countdown: { ...componentLayouts.countdown, scale: parseFloat(e.target.value) }
                          })}
                          className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Min Width: {componentLayouts.countdown.minWidth || 320}px
                        </label>
                        <input
                          type='range'
                          min='250'
                          max='500'
                          step='50'
                          value={componentLayouts.countdown.minWidth || 320}
                          onChange={e => setComponentLayouts({
                            ...componentLayouts,
                            countdown: { ...componentLayouts.countdown, minWidth: parseInt(e.target.value) }
                          })}
                          className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500'
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Emote Wall */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center gap-3 mb-6'>
                <div className='w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center'>
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
                      d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
                <h2 className='text-xl font-bold'>Emote Wall</h2>
              </div>

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm text-gray-300 mb-2'>
                    Emotes (space-separated)
                  </label>
                  <input
                    type='text'
                    value={emoteInput}
                    onChange={e => setEmoteInput(e.target.value)}
                    className='w-full bg-gray-700/50 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-pink-500 focus:outline-none'
                    placeholder='🎉 🎊 ✨ 🌟 💫'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Use emoji or paste emote URLs
                  </p>
                </div>

                <div>
                  <label className='block text-sm text-gray-300 mb-2'>
                    Intensity
                  </label>
                  <div className='grid grid-cols-3 gap-2'>
                    {(['light', 'medium', 'heavy'] as const).map(intensity => (
                      <button
                        key={intensity}
                        onClick={() => setEmoteIntensity(intensity)}
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
                  onClick={triggerEmoteWall}
                  disabled={!isConnected}
                  className='w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-xl px-6 py-4 font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-xl'
                >
                  {isConnected ? '🎉 Trigger Emote Wall! 🎉' : 'Not Connected'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Spotify */}
          <div className='lg:col-span-1 space-y-6'>
            {/* Now Playing */}
            <div className='bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl'>
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-3'>
                  <div className='w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center'>
                    <svg
                      className='w-6 h-6'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
                    </svg>
                  </div>
                  <h2 className='text-xl font-bold'>Now Playing</h2>
                </div>
                <button
                  onClick={() => toggleLayer('nowplaying')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    layers.find(l => l.id === 'nowplaying')?.visible
                      ? 'bg-green-600 hover:bg-green-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {layers.find(l => l.id === 'nowplaying')?.visible ? '👁️ Visible' : '🚫 Hidden'}
                </button>
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

                  {/* Position & Size Controls */}
                  <div className='mt-4'>
                    <h4 className='text-sm font-semibold text-gray-300 mb-3'>Position & Size</h4>
                    <PositionControls
                      x={componentLayouts.nowPlaying.x || 0}
                      y={componentLayouts.nowPlaying.y || 0}
                      onPositionChange={(x, y) => setComponentLayouts({
                        ...componentLayouts,
                        nowPlaying: { ...componentLayouts.nowPlaying, position: 'top-left', x, y }
                      })}
                      color='green'
                      elementWidth={componentLayouts.nowPlaying.width || 400}
                      elementHeight={120}
                      scale={componentLayouts.nowPlaying.scale || 1}
                    />
                    <div className='grid grid-cols-2 gap-3 mt-3'>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Width: {componentLayouts.nowPlaying.width || 400}px
                        </label>
                        <input
                          type='range'
                          min='300'
                          max='600'
                          step='50'
                          value={componentLayouts.nowPlaying.width || 400}
                          onChange={e => setComponentLayouts({
                            ...componentLayouts,
                            nowPlaying: { ...componentLayouts.nowPlaying, width: parseInt(e.target.value) }
                          })}
                          className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
                        />
                      </div>
                      <div>
                        <label className='block text-xs text-gray-400 mb-1'>
                          Scale: {(componentLayouts.nowPlaying.scale || 1).toFixed(1)}x
                        </label>
                        <input
                          type='range'
                          min='0.5'
                          max='2'
                          step='0.1'
                          value={componentLayouts.nowPlaying.scale || 1}
                          onChange={e => setComponentLayouts({
                            ...componentLayouts,
                            nowPlaying: { ...componentLayouts.nowPlaying, scale: parseFloat(e.target.value) }
                          })}
                          className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual Override */}
                  <details className='group mt-4'>
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
