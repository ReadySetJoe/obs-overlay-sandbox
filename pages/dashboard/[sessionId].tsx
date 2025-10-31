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
import SessionInfo from '@/components/dashboard/SessionInfo';
import SummaryTile from '@/components/dashboard/tiles/SummaryTile';
import ColorSchemeExpanded from '@/components/dashboard/expanded/ColorSchemeExpanded';
import WeatherExpanded from '@/components/dashboard/expanded/WeatherExpanded';
import EmoteWallExpanded from '@/components/dashboard/expanded/EmoteWallExpanded';
import NowPlayingExpanded from '@/components/dashboard/expanded/NowPlayingExpanded';
import CountdownExpanded from '@/components/dashboard/expanded/CountdownExpanded';

export default function DashboardPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket(sessionId as string);

  // Save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Spotify Authentication
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(null);

  // Now Playing
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

  // Expanded element for editing
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

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
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);
      const cleanUrl = sessionId ? `/dashboard/${sessionId}` : window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else {
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
        const response = await fetch(`/api/layouts/load?sessionId=${sessionId}`);
        if (response.ok) {
          const { layout } = await response.json();

          setColorScheme(layout.colorScheme);
          setWeatherEffect(layout.weatherEffect);
          setLayers([
            { id: 'weather', name: 'Weather', visible: layout.weatherVisible },
            { id: 'chat', name: 'Chat', visible: layout.chatVisible },
            { id: 'nowplaying', name: 'Now Playing', visible: layout.nowPlayingVisible },
            { id: 'countdown', name: 'Countdown', visible: layout.countdownVisible },
          ]);

          if (layout.componentLayouts) {
            try {
              const parsedLayouts = JSON.parse(layout.componentLayouts);
              setComponentLayouts(parsedLayouts);
            } catch (error) {
              console.error('Error parsing component layouts:', error);
            }
          }

          setLastSaved(new Date(layout.updatedAt));
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
    }, 1000);

    return () => clearTimeout(timer);
  }, [session, colorScheme, weatherEffect, layers, componentLayouts, saveLayout]);

  // Poll Spotify API for now playing
  useEffect(() => {
    if (!spotifyToken || !socket || !isConnected) return;

    const pollSpotify = async () => {
      try {
        const response = await fetch(`/api/spotify/now-playing?access_token=${spotifyToken}`);

        if (response.status === 401 && spotifyRefreshToken) {
          const refreshResponse = await fetch(
            `/api/spotify/refresh?refresh_token=${spotifyRefreshToken}`
          );
          const refreshData = await refreshResponse.json();

          if (refreshResponse.ok) {
            setSpotifyToken(refreshData.access_token);
            localStorage.setItem('spotify_access_token', refreshData.access_token);
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

    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;

    const newVisible = !layer.visible;
    setLayers((prev) => prev.map((l) => (l.id === layerId ? { ...l, visible: newVisible } : l)));

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
          setTimers((prev) => prev.map((t) => (t.id === editingTimerId ? timer : t)));
          cancelTimerForm();
        }
      } else {
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
          setTimers((prev) => [...prev, timer]);
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
        setTimers((prev) => prev.filter((t) => t.id !== timerId));
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
        setTimers((prev) => prev.map((t) => (t.id === timerId ? timer : t)));
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
    }
  };

  const triggerEmoteWall = () => {
    if (!socket || !isConnected) return;

    const emotes = emoteInput.split(/\s+/).filter((e) => e.trim());
    const config: EmoteWallConfig = {
      emotes,
      duration: 10000,
      intensity: emoteIntensity,
    };

    socket.emit('emote-wall', config);
  };

  const handleExpandElement = (element: string) => {
    setIsExpanding(true);
    setExpandedElement(element);
    // Wait for expansion animation to complete before showing content
    setTimeout(() => {
      setIsExpanding(false);
    }, 400);
  };

  const handleCloseExpanded = () => {
    setExpandedElement(null);
    setIsExpanding(false);
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
                  <span className='text-sm font-semibold'>{isConnected ? 'Live' : 'Offline'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Info */}
          {sessionId && <SessionInfo sessionId={sessionId as string} isAuthenticated={!!session} />}
        </div>

        {/* Main Content */}
        {!expandedElement ? (
          /* Summary Tiles Grid */
          <div key='summary-grid' className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-zoom-in'>
            {/* Now Playing Tile */}
            <SummaryTile
              title='Now Playing'
              subtitle={spotifyToken ? trackTitle || 'Connected' : 'Not connected'}
              icon={
                <svg className='w-7 h-7' fill='currentColor' viewBox='0 0 24 24'>
                  <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
                </svg>
              }
              color='green'
              isVisible={layers.find((l) => l.id === 'nowplaying')?.visible}
              onToggleVisibility={() => toggleLayer('nowplaying')}
              onClick={() => handleExpandElement('nowplaying')}
            />

            {/* Countdown Timers Tile */}
            <SummaryTile
              title='Countdown Timers'
              subtitle={`${timers.length} timer${timers.length !== 1 ? 's' : ''}`}
              icon={
                <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              color='yellow'
              isVisible={layers.find((l) => l.id === 'countdown')?.visible}
              onToggleVisibility={() => toggleLayer('countdown')}
              onClick={() => handleExpandElement('countdown')}
            />

            {/* Weather Effects Tile */}
            <SummaryTile
              title='Weather Effects'
              subtitle={weatherEffect}
              icon={
                <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
                  />
                </svg>
              }
              color='cyan'
              isVisible={layers.find((l) => l.id === 'weather')?.visible}
              onToggleVisibility={() => toggleLayer('weather')}
              onClick={() => handleExpandElement('weather')}
            />

            {/* Color Scheme Tile */}
            <SummaryTile
              title='Color Scheme'
              subtitle={colorScheme}
              icon={
                <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'
                  />
                </svg>
              }
              color='purple'
              onClick={() => handleExpandElement('color')}
            />

            {/* Emote Wall Tile */}
            <SummaryTile
              title='Emote Wall'
              subtitle={`${emoteIntensity} intensity`}
              icon={
                <svg className='w-7 h-7' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  />
                </svg>
              }
              color='pink'
              onClick={() => handleExpandElement('emote')}
            />
          </div>
        ) : (
          /* Expanded Element View */
          <div key={`expanded-${expandedElement}`} className={`relative ${isExpanding ? 'animate-tile-expand' : 'animate-zoom-in'}`}>
            {/* Expanding placeholder - Show during expansion */}
            {isExpanding && (
              <div className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl min-h-[400px] flex items-center justify-center`}>
                <div className='w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin' />
              </div>
            )}

            {/* Render expanded element - Only show after expansion */}
            {!isExpanding && expandedElement === 'color' && (
              <ColorSchemeExpanded
                colorScheme={colorScheme}
                onColorSchemeChange={changeColorScheme}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'weather' && (
              <WeatherExpanded
                weatherEffect={weatherEffect}
                isVisible={layers.find((l) => l.id === 'weather')?.visible || false}
                componentLayouts={componentLayouts}
                onWeatherChange={changeWeather}
                onToggleVisibility={() => toggleLayer('weather')}
                onDensityChange={(density) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    weather: { ...componentLayouts.weather, density },
                  })
                }
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'nowplaying' && (
              <NowPlayingExpanded
                spotifyToken={spotifyToken}
                sessionId={sessionId as string}
                trackTitle={trackTitle}
                trackArtist={trackArtist}
                trackAlbumArt={trackAlbumArt}
                isPlaying={isPlaying}
                isVisible={layers.find((l) => l.id === 'nowplaying')?.visible || false}
                componentLayouts={componentLayouts}
                onDisconnect={() => {
                  setSpotifyToken(null);
                  setSpotifyRefreshToken(null);
                  localStorage.removeItem('spotify_access_token');
                  localStorage.removeItem('spotify_refresh_token');
                }}
                onToggleVisibility={() => toggleLayer('nowplaying')}
                onPositionChange={(x, y) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    nowPlaying: { ...componentLayouts.nowPlaying, position: 'top-left', x, y },
                  })
                }
                onWidthChange={(width) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    nowPlaying: { ...componentLayouts.nowPlaying, width },
                  })
                }
                onScaleChange={(scale) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    nowPlaying: { ...componentLayouts.nowPlaying, scale },
                  })
                }
                onTrackTitleChange={setTrackTitle}
                onTrackArtistChange={setTrackArtist}
                onTrackAlbumArtChange={setTrackAlbumArt}
                onIsPlayingChange={setIsPlaying}
                onManualUpdate={updateNowPlaying}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'countdown' && (
              <CountdownExpanded
                timers={timers}
                isVisible={layers.find((l) => l.id === 'countdown')?.visible || false}
                isAuthenticated={!!session}
                showTimerForm={showTimerForm}
                editingTimerId={editingTimerId}
                newTimerTitle={newTimerTitle}
                newTimerDescription={newTimerDescription}
                newTimerDate={newTimerDate}
                componentLayouts={componentLayouts}
                onToggleVisibility={() => toggleLayer('countdown')}
                onShowTimerForm={() => setShowTimerForm(!showTimerForm)}
                onCreateTimer={createTimer}
                onCancelTimerForm={cancelTimerForm}
                onStartEditingTimer={startEditingTimer}
                onDeleteTimer={deleteTimer}
                onToggleTimer={toggleTimer}
                onNewTimerTitleChange={setNewTimerTitle}
                onNewTimerDescriptionChange={setNewTimerDescription}
                onNewTimerDateChange={setNewTimerDate}
                onPositionChange={(x, y) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    countdown: { ...componentLayouts.countdown, position: 'top-left', x, y },
                  })
                }
                onScaleChange={(scale) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    countdown: { ...componentLayouts.countdown, scale },
                  })
                }
                onMinWidthChange={(minWidth) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    countdown: { ...componentLayouts.countdown, minWidth },
                  })
                }
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'emote' && (
              <EmoteWallExpanded
                emoteInput={emoteInput}
                emoteIntensity={emoteIntensity}
                isConnected={isConnected}
                onEmoteInputChange={setEmoteInput}
                onIntensityChange={setEmoteIntensity}
                onTrigger={triggerEmoteWall}
                onClose={handleCloseExpanded}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
