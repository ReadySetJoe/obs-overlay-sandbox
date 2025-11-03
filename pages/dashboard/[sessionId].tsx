// pages/dashboard/[sessionId].tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useSession, signIn } from 'next-auth/react';
import { useSocket } from '@/hooks/useSocket';
import { useSpotify } from '@/hooks/useSpotify';
import { useTimers } from '@/hooks/useTimers';
import { usePaintByNumbers } from '@/hooks/usePaintByNumbers';
import { useTwitchChat } from '@/hooks/useTwitchChat';
import { serializePaintState } from '@/lib/paintStateManager';
import {
  ColorScheme,
  CustomColors,
  WeatherEffect,
  EmoteWallConfig,
  ComponentLayouts,
  EventLabelsConfig,
} from '@/types/overlay';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SummaryTile from '@/components/dashboard/tiles/SummaryTile';
import ColorSchemeExpanded from '@/components/dashboard/expanded/ColorSchemeExpanded';
import WeatherExpanded from '@/components/dashboard/expanded/WeatherExpanded';
import EmoteWallExpanded from '@/components/dashboard/expanded/EmoteWallExpanded';
import NowPlayingExpanded from '@/components/dashboard/expanded/NowPlayingExpanded';
import CountdownExpanded from '@/components/dashboard/expanded/CountdownExpanded';
import ChatHighlightExpanded from '@/components/dashboard/expanded/ChatHighlightExpanded';
import PaintByNumbersExpanded from '@/components/dashboard/expanded/PaintByNumbersExpanded';
import BackgroundExpanded from '@/components/dashboard/expanded/BackgroundExpanded';
import AlertsExpanded from '@/components/dashboard/expanded/AlertsExpanded';
import EventLabelsExpanded from '@/components/dashboard/expanded/EventLabelsExpanded';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket(sessionId as string);

  // Save status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    'saved'
  );
  const [_lastSaved, setLastSaved] = useState<Date | null>(null);

  // Scene Layers
  const [layers, setLayers] = useState([
    { id: 'weather', name: 'Weather', visible: true },
    { id: 'chat', name: 'Chat', visible: true },
    { id: 'nowplaying', name: 'Now Playing', visible: true },
    { id: 'countdown', name: 'Countdown', visible: true },
    { id: 'chathighlight', name: 'Chat Highlight', visible: true },
    { id: 'paintbynumbers', name: 'Paint by Numbers', visible: true },
    { id: 'eventlabels', name: 'Recent Events', visible: true },
  ]);

  // Use extracted hooks
  const nowPlayingVisible =
    layers.find(l => l.id === 'nowplaying')?.visible ?? true;
  const spotify = useSpotify({ socket, isConnected, nowPlayingVisible });
  const timersHook = useTimers({ sessionId: sessionId as string, session });
  const paintHook = usePaintByNumbers({
    sessionId: sessionId as string,
    session,
    socket,
    isConnected,
  });
  const chatHook = useTwitchChat({
    sessionId: sessionId as string,
    session,
    socket,
  });

  // Overlay settings
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);
  const [fontFamily, setFontFamily] = useState<string>('Inter');
  const [weatherEffect, setWeatherEffect] = useState<WeatherEffect>('none');

  // Emote wall
  const [emoteInput, setEmoteInput] = useState('🎉 🎊 ✨ 🌟 💫');
  const [emoteIntensity, setEmoteIntensity] = useState<
    'light' | 'medium' | 'heavy'
  >('medium');

  // Background
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    null
  );
  const [backgroundImageName, setBackgroundImageName] = useState<string | null>(
    null
  );
  const [backgroundColors, setBackgroundColors] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(1.0);
  const [backgroundBlur, setBackgroundBlur] = useState(0);

  // Event Labels
  const [eventLabelsConfig, setEventLabelsConfig] = useState<EventLabelsConfig>(
    {
      showFollower: true,
      showSub: true,
      showBits: true,
      showRaid: true,
      showGiftSub: true,
      followerLabel: 'Latest Follower',
      subLabel: 'Latest Subscriber',
      bitsLabel: 'Latest Bits',
      raidLabel: 'Latest Raid',
      giftSubLabel: 'Latest Gift Sub',
    }
  );

  // Expanded element for editing
  const [expandedElement, setExpandedElement] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  // Component layouts
  const [componentLayouts, setComponentLayouts] = useState<ComponentLayouts>({
    chat: { position: 'top-left', x: 0, y: 80, maxWidth: 400 },
    nowPlaying: { position: 'top-left', x: 0, y: 0, width: 400, scale: 1 },
    countdown: { position: 'custom', x: 960, y: 100, scale: 1, minWidth: 320 },
    weather: { density: 1 },
    chatHighlight: {
      position: 'custom',
      x: 960,
      y: 800,
      width: 500,
      scale: 1,
    },
    paintByNumbers: {
      position: 'top-left',
      x: 0,
      y: 0,
      scale: 1,
      gridSize: 20,
    },
    eventLabels: {
      position: 'top-right',
      x: 20,
      y: 20,
      scale: 1,
    },
  });

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

          setColorScheme(layout.colorScheme);

          // Restore custom colors if they exist
          if (layout.customColors) {
            try {
              const parsedCustomColors = JSON.parse(layout.customColors);
              setCustomColors(parsedCustomColors);
            } catch (error) {
              console.error('Error parsing custom colors:', error);
            }
          }

          // Restore font family
          if (layout.fontFamily) {
            setFontFamily(layout.fontFamily);
          }

          setWeatherEffect(layout.weatherEffect);
          setLayers([
            { id: 'weather', name: 'Weather', visible: layout.weatherVisible },
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
            {
              id: 'chathighlight',
              name: 'Chat Highlight',
              visible: layout.chatHighlightVisible ?? true,
            },
            {
              id: 'paintbynumbers',
              name: 'Paint by Numbers',
              visible: layout.paintByNumbersVisible ?? true,
            },
            {
              id: 'eventlabels',
              name: 'Recent Events',
              visible: layout.eventLabelsVisible ?? true,
            },
          ]);

          if (layout.componentLayouts) {
            try {
              const parsedLayouts = JSON.parse(layout.componentLayouts);
              setComponentLayouts({
                chat: parsedLayouts.chat || {
                  position: 'top-left',
                  x: 0,
                  y: 80,
                  maxWidth: 400,
                },
                nowPlaying: parsedLayouts.nowPlaying || {
                  position: 'top-left',
                  x: 0,
                  y: 0,
                  width: 400,
                  scale: 1,
                },
                countdown: parsedLayouts.countdown || {
                  position: 'top-left',
                  x: 0,
                  y: 0,
                  scale: 1,
                  minWidth: 320,
                },
                weather: parsedLayouts.weather || { density: 1 },
                chatHighlight: parsedLayouts.chatHighlight || {
                  position: 'bottom-left',
                  x: 20,
                  y: 20,
                  width: 500,
                  scale: 1,
                },
                paintByNumbers: parsedLayouts.paintByNumbers || {
                  position: 'top-left',
                  x: 0,
                  y: 0,
                  scale: 1,
                  gridSize: 20,
                },
              });
            } catch (error) {
              console.error('Error parsing component layouts:', error);
            }
          }

          // Load background data
          if (layout.backgroundImageUrl) {
            setBackgroundImageUrl(layout.backgroundImageUrl);
            setBackgroundImageName(layout.backgroundImageName || null);
            setBackgroundColors(layout.backgroundColors || null);
            setBackgroundOpacity(layout.backgroundOpacity ?? 1.0);
            setBackgroundBlur(layout.backgroundBlur ?? 0);
          }

          setLastSaved(new Date(layout.updatedAt));
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
      // Load existing saved states
      const loadResponse = await fetch(
        `/api/layouts/load?sessionId=${sessionId}`
      );
      let existingStates: Record<string, any> = {};

      if (loadResponse.ok) {
        const { layout } = await loadResponse.json();
        if (layout.paintByNumbersState) {
          try {
            existingStates = JSON.parse(layout.paintByNumbersState);
          } catch (error) {
            console.error('Error parsing existing paint states:', error);
          }
        }
      }

      // Serialize paint state if it exists
      let serializedPaintState = JSON.stringify(existingStates);
      if (paintHook.paintByNumbersState) {
        serializedPaintState = serializePaintState(
          paintHook.paintByNumbersState,
          existingStates
        );
      }

      const response = await fetch('/api/layouts/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          colorScheme,
          customColors: customColors ? JSON.stringify(customColors) : null,
          fontFamily,
          weatherEffect,
          layers,
          componentLayouts: JSON.stringify(componentLayouts),
          paintByNumbersState: serializedPaintState,
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
    colorScheme,
    customColors,
    weatherEffect,
    layers,
    componentLayouts,
    paintHook.paintByNumbersState,
  ]);

  // Debounced auto-save
  useEffect(() => {
    if (!session) return;

    setSaveStatus('unsaved');
    const timer = setTimeout(() => {
      saveLayout();
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    session,
    colorScheme,
    customColors,
    fontFamily,
    weatherEffect,
    layers,
    componentLayouts,
    paintHook.paintByNumbersState,
    saveLayout,
  ]);

  const changeColorScheme = (scheme: ColorScheme) => {
    if (!socket) return;
    setColorScheme(scheme);
    socket.emit('color-scheme-change', scheme);

    // Emit custom colors if using custom scheme
    if (scheme === 'custom' && customColors) {
      socket.emit('custom-colors-change', customColors);
    }
  };

  const handleCustomColorsChange = (colors: CustomColors) => {
    if (!socket) return;
    setCustomColors(colors);
    socket.emit('custom-colors-change', colors);

    // If not already on custom scheme, switch to it
    if (colorScheme !== 'custom') {
      setColorScheme('custom');
      socket.emit('color-scheme-change', 'custom');
    }
  };

  const handleFontFamilyChange = (font: string) => {
    if (!socket) return;
    setFontFamily(font);
    socket.emit('font-family-change', font);
  };

  const handleEventLabelsConfigChange = (config: EventLabelsConfig) => {
    if (!socket) return;
    setEventLabelsConfig(config);
    socket.emit('event-labels-config', config);
  };

  const changeWeather = (effect: WeatherEffect) => {
    if (!socket) return;
    setWeatherEffect(effect);
    socket.emit('weather-change', effect);
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

  const handleBackgroundChange = (data: {
    backgroundImageUrl: string | null;
    backgroundOpacity: number;
    backgroundBlur: number;
  }) => {
    if (!socket) return;
    setBackgroundOpacity(data.backgroundOpacity);
    setBackgroundBlur(data.backgroundBlur);
    socket.emit('background-change', data);
  };

  // Emit timers to overlay when they change
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('countdown-timers', timersHook.timers);
  }, [socket, isConnected, timersHook.timers]);

  // Emit component layouts to overlay when they change
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('component-layouts', componentLayouts);
  }, [socket, isConnected, componentLayouts]);

  const triggerEmoteWall = () => {
    if (!socket || !isConnected) return;

    const emotes = emoteInput.split(/\s+/).filter(e => e.trim());
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

  // Listen for background changes from upload/delete API
  useEffect(() => {
    if (!socket) return;

    const handleBackgroundUpdate = (data: {
      backgroundImageUrl: string | null;
      backgroundImageName: string | null;
      backgroundColors: string | null;
      backgroundOpacity: number;
      backgroundBlur: number;
    }) => {
      setBackgroundImageUrl(data.backgroundImageUrl);
      setBackgroundImageName(data.backgroundImageName);
      setBackgroundColors(data.backgroundColors);
      setBackgroundOpacity(data.backgroundOpacity);
      setBackgroundBlur(data.backgroundBlur);
    };

    socket.on('background-change', handleBackgroundUpdate);

    return () => {
      socket.off('background-change', handleBackgroundUpdate);
    };
  }, [socket]);

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <DashboardHeader
          sessionId={sessionId as string}
          session={session}
          isConnected={isConnected}
          saveStatus={saveStatus}
        />

        {/* Main Content */}
        {!expandedElement ? (
          /* Summary Tiles Grid */
          <div
            key='summary-grid'
            className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-zoom-in'
          >
            {/* Chat Highlight Tile - Most important for viewer engagement */}
            <SummaryTile
              title='Chat Highlight'
              subtitle={
                !session
                  ? 'Connect Twitch to use'
                  : chatHook.chatHighlight
                    ? chatHook.chatHighlight.message.username
                    : `${chatHook.chatMessages.length} messages`
              }
              icon={
                <svg
                  className='w-7 h-7'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'
                  />
                </svg>
              }
              color='yellow'
              isVisible={layers.find(l => l.id === 'chathighlight')?.visible}
              onToggleVisibility={() => toggleLayer('chathighlight')}
              onClick={() => handleExpandElement('chathighlight')}
              authRequired={!session}
              onAuthClick={() => signIn('twitch')}
            />

            {/* Now Playing Tile */}
            <SummaryTile
              title='Now Playing'
              subtitle={
                spotify.spotifyToken
                  ? spotify.trackTitle || 'Connected'
                  : 'Not connected'
              }
              icon={
                <svg
                  className='w-7 h-7'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z' />
                </svg>
              }
              color='green'
              isVisible={layers.find(l => l.id === 'nowplaying')?.visible}
              onToggleVisibility={() => toggleLayer('nowplaying')}
              onClick={() => handleExpandElement('nowplaying')}
            />

            {/* Countdown Timers Tile */}
            <SummaryTile
              title='Countdown Timers'
              subtitle={`${timersHook.timers.length} timer${timersHook.timers.length !== 1 ? 's' : ''}`}
              icon={
                <svg
                  className='w-7 h-7'
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
              }
              color='yellow'
              isVisible={layers.find(l => l.id === 'countdown')?.visible}
              onToggleVisibility={() => toggleLayer('countdown')}
              onClick={() => handleExpandElement('countdown')}
            />

            {/* Color Scheme Tile */}
            <SummaryTile
              title='Color Scheme'
              subtitle={colorScheme}
              icon={
                <svg
                  className='w-7 h-7'
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
              }
              color='purple'
              onClick={() => handleExpandElement('color')}
            />

            {/* Custom Background Tile */}
            <SummaryTile
              title='Custom Background'
              subtitle={
                backgroundImageUrl
                  ? backgroundImageName || 'Uploaded'
                  : 'No background'
              }
              icon={
                <svg
                  className='w-7 h-7'
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
              }
              color='cyan'
              onClick={() => handleExpandElement('background')}
            />

            {/* Weather Effects Tile */}
            <SummaryTile
              title='Weather Effects'
              subtitle={weatherEffect}
              icon={
                <svg
                  className='w-7 h-7'
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
              }
              color='cyan'
              isVisible={layers.find(l => l.id === 'weather')?.visible}
              onToggleVisibility={() => toggleLayer('weather')}
              onClick={() => handleExpandElement('weather')}
            />

            {/* Emote Wall Tile */}
            <SummaryTile
              title='Emote Wall'
              subtitle={`${emoteIntensity} intensity`}
              icon={
                <svg
                  className='w-7 h-7'
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
              }
              color='pink'
              onClick={() => handleExpandElement('emote')}
            />

            {/* Paint by Numbers Tile */}
            <SummaryTile
              title='Paint by Numbers'
              subtitle={
                paintHook.paintByNumbersState
                  ? `${paintHook.paintByNumbersState.regions.filter(r => r.filled).length}/${paintHook.paintByNumbersState.regions.length} filled`
                  : 'Select template'
              }
              icon={<span className='text-3xl'>🎨</span>}
              color='purple'
              isVisible={layers.find(l => l.id === 'paintbynumbers')?.visible}
              onToggleVisibility={() => toggleLayer('paintbynumbers')}
              onClick={() => handleExpandElement('paint')}
            />

            {/* Alerts Tile */}
            <SummaryTile
              title='Stream Alerts'
              subtitle='5 event types'
              icon={
                <svg
                  className='w-7 h-7'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                  />
                </svg>
              }
              color='pink'
              onClick={() => handleExpandElement('alerts')}
            />

            {/* Event Labels Tile */}
            <SummaryTile
              title='Recent Events'
              subtitle='Latest follower, sub, bits, etc.'
              icon='📊'
              color='green'
              isVisible={layers.find(l => l.id === 'eventlabels')?.visible}
              onToggleVisibility={() => toggleLayer('eventlabels')}
              onClick={() => handleExpandElement('eventlabels')}
            />
          </div>
        ) : (
          /* Expanded Element View */
          <div
            key={`expanded-${expandedElement}`}
            className={`relative ${isExpanding ? 'animate-tile-expand' : 'animate-zoom-in'}`}
          >
            {/* Expanding placeholder - Show during expansion */}
            {isExpanding && (
              <div
                className={`bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl min-h-[400px] flex items-center justify-center`}
              >
                <div className='w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin' />
              </div>
            )}

            {/* Render expanded element - Only show after expansion */}
            {!isExpanding && expandedElement === 'color' && (
              <ColorSchemeExpanded
                colorScheme={colorScheme}
                customColors={customColors}
                fontFamily={fontFamily}
                onColorSchemeChange={changeColorScheme}
                onCustomColorsChange={handleCustomColorsChange}
                onFontFamilyChange={handleFontFamilyChange}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'weather' && (
              <WeatherExpanded
                sessionId={sessionId as string}
                weatherEffect={weatherEffect}
                isVisible={
                  layers.find(l => l.id === 'weather')?.visible || false
                }
                componentLayouts={componentLayouts}
                onWeatherChange={changeWeather}
                onToggleVisibility={() => toggleLayer('weather')}
                onDensityChange={density =>
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
                spotifyToken={spotify.spotifyToken}
                sessionId={sessionId as string}
                trackTitle={spotify.trackTitle}
                trackArtist={spotify.trackArtist}
                trackAlbumArt={spotify.trackAlbumArt}
                isPlaying={spotify.isPlaying}
                isVisible={
                  layers.find(l => l.id === 'nowplaying')?.visible || false
                }
                componentLayouts={componentLayouts}
                onDisconnect={spotify.disconnect}
                onToggleVisibility={() => toggleLayer('nowplaying')}
                onPositionChange={(x, y) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    nowPlaying: {
                      ...componentLayouts.nowPlaying,
                      position: 'top-left',
                      x,
                      y,
                    },
                  })
                }
                onWidthChange={width =>
                  setComponentLayouts({
                    ...componentLayouts,
                    nowPlaying: { ...componentLayouts.nowPlaying, width },
                  })
                }
                onScaleChange={scale =>
                  setComponentLayouts({
                    ...componentLayouts,
                    nowPlaying: { ...componentLayouts.nowPlaying, scale },
                  })
                }
                onTrackTitleChange={spotify.setTrackTitle}
                onTrackArtistChange={spotify.setTrackArtist}
                onTrackAlbumArtChange={spotify.setTrackAlbumArt}
                onIsPlayingChange={spotify.setIsPlaying}
                onManualUpdate={spotify.updateNowPlaying}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'countdown' && (
              <CountdownExpanded
                sessionId={sessionId as string}
                timers={timersHook.timers}
                isVisible={
                  layers.find(l => l.id === 'countdown')?.visible || false
                }
                isAuthenticated={!!session}
                showTimerForm={timersHook.showTimerForm}
                editingTimerId={timersHook.editingTimerId}
                newTimerTitle={timersHook.newTimerTitle}
                newTimerDescription={timersHook.newTimerDescription}
                newTimerDate={timersHook.newTimerDate}
                componentLayouts={componentLayouts}
                onToggleVisibility={() => toggleLayer('countdown')}
                onShowTimerForm={() =>
                  timersHook.setShowTimerForm(!timersHook.showTimerForm)
                }
                onCreateTimer={timersHook.createTimer}
                onCancelTimerForm={timersHook.cancelTimerForm}
                onStartEditingTimer={timersHook.startEditingTimer}
                onDeleteTimer={timersHook.deleteTimer}
                onToggleTimer={timersHook.toggleTimer}
                onNewTimerTitleChange={timersHook.setNewTimerTitle}
                onNewTimerDescriptionChange={timersHook.setNewTimerDescription}
                onNewTimerDateChange={timersHook.setNewTimerDate}
                onPositionChange={(x, y) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    countdown: {
                      ...componentLayouts.countdown,
                      position: 'top-left',
                      x,
                      y,
                    },
                  })
                }
                onScaleChange={scale =>
                  setComponentLayouts({
                    ...componentLayouts,
                    countdown: { ...componentLayouts.countdown, scale },
                  })
                }
                onMinWidthChange={minWidth =>
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
                sessionId={sessionId as string}
                emoteInput={emoteInput}
                emoteIntensity={emoteIntensity}
                isConnected={isConnected}
                onEmoteInputChange={setEmoteInput}
                onIntensityChange={setEmoteIntensity}
                onTrigger={triggerEmoteWall}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'paint' && (
              <PaintByNumbersExpanded
                sessionId={sessionId as string}
                paintState={paintHook.paintByNumbersState}
                isVisible={
                  layers.find(l => l.id === 'paintbynumbers')?.visible || false
                }
                componentLayouts={componentLayouts}
                onToggleVisibility={() => toggleLayer('paintbynumbers')}
                onTemplateSelect={paintHook.handleTemplateSelect}
                onReset={paintHook.handleReset}
                onPositionChange={(x, y) =>
                  paintHook.handlePositionChange(
                    x,
                    y,
                    componentLayouts,
                    setComponentLayouts
                  )
                }
                onScaleChange={scale =>
                  paintHook.handleScaleChange(
                    scale,
                    componentLayouts,
                    setComponentLayouts
                  )
                }
                onGridSizeChange={gridSize =>
                  paintHook.handleGridSizeChange(
                    gridSize,
                    componentLayouts,
                    setComponentLayouts
                  )
                }
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'chathighlight' && (
              <ChatHighlightExpanded
                sessionId={sessionId as string}
                messages={chatHook.chatMessages}
                currentHighlight={chatHook.chatHighlight}
                isVisible={
                  layers.find(l => l.id === 'chathighlight')?.visible || false
                }
                isAuthenticated={!!session}
                twitchUsername={session?.user?.name || null}
                componentLayouts={componentLayouts}
                onHighlightMessage={message =>
                  chatHook.highlightChatMessage(message, componentLayouts)
                }
                onClearHighlight={() =>
                  chatHook.clearChatHighlight(componentLayouts)
                }
                onToggleVisibility={() => toggleLayer('chathighlight')}
                onPositionChange={(x, y) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    chatHighlight: { ...componentLayouts.chatHighlight, x, y },
                  })
                }
                onWidthChange={width =>
                  setComponentLayouts({
                    ...componentLayouts,
                    chatHighlight: { ...componentLayouts.chatHighlight, width },
                  })
                }
                onScaleChange={scale =>
                  setComponentLayouts({
                    ...componentLayouts,
                    chatHighlight: { ...componentLayouts.chatHighlight, scale },
                  })
                }
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'background' && (
              <BackgroundExpanded
                sessionId={sessionId as string}
                backgroundImageUrl={backgroundImageUrl}
                backgroundImageName={backgroundImageName}
                backgroundColors={backgroundColors}
                backgroundOpacity={backgroundOpacity}
                backgroundBlur={backgroundBlur}
                onBackgroundChange={handleBackgroundChange}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'alerts' && (
              <AlertsExpanded
                sessionId={sessionId as string}
                onClose={handleCloseExpanded}
              />
            )}

            {!isExpanding && expandedElement === 'eventlabels' && (
              <EventLabelsExpanded
                sessionId={sessionId as string}
                config={eventLabelsConfig}
                componentLayouts={componentLayouts}
                onConfigChange={handleEventLabelsConfigChange}
                onPositionChange={(x, y) =>
                  setComponentLayouts({
                    ...componentLayouts,
                    eventLabels: {
                      position:
                        componentLayouts.eventLabels?.position || 'top-right',
                      x,
                      y,
                      scale: componentLayouts.eventLabels?.scale || 1,
                    },
                  })
                }
                onScaleChange={scale =>
                  setComponentLayouts({
                    ...componentLayouts,
                    eventLabels: {
                      position:
                        componentLayouts.eventLabels?.position || 'top-right',
                      x: componentLayouts.eventLabels?.x || 20,
                      y: componentLayouts.eventLabels?.y || 20,
                      scale,
                    },
                  })
                }
                onClose={handleCloseExpanded}
              />
            )}
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
