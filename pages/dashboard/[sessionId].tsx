// pages/dashboard/[sessionId].tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useSocket } from '@/hooks/useSocket';
import { useSpotify } from '@/hooks/useSpotify';
import { useTimers } from '@/hooks/useTimers';
import { usePaintByNumbers } from '@/hooks/usePaintByNumbers';
import { useTwitchChat } from '@/hooks/useTwitchChat';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBackground } from '@/hooks/useBackground';
import { useWeatherEffect } from '@/hooks/useWeatherEffect';
import { useEmoteWall } from '@/hooks/useEmoteWall';
import { useLayers } from '@/hooks/useLayers';
import { useEventLabels } from '@/hooks/useEventLabels';
import { useStreamStats } from '@/hooks/useStreamStats';
import { useWheels } from '@/hooks/useWheels';
import { useExpandedView } from '@/hooks/useExpandedView';
import { useLayoutPersistence } from '@/hooks/useLayoutPersistence';
import { useAlerts } from '@/hooks/useAlerts';
import { ComponentLayouts } from '@/types/overlay';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import SummaryTile from '@/components/dashboard/tiles/SummaryTile';
import {
  ChatHighlightIcon,
  NowPlayingIcon,
  CountdownIcon,
  ColorSchemeIcon,
  BackgroundIcon,
  WeatherIcon,
  EmoteWallIcon,
  PaintByNumbersIcon,
  AlertsIcon,
  EventLabelsIcon,
  StreamStatsIcon,
  WheelIcon,
} from '@/components/dashboard/tiles/TileIcons';
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
import StreamStatsExpanded from '@/components/dashboard/expanded/StreamStatsExpanded';
import WheelExpanded from '@/components/dashboard/expanded/WheelExpanded';
import Footer from '@/components/Footer';

export default function DashboardPage() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { data: session } = useSession();
  const { socket, isConnected } = useSocket(sessionId as string);

  // Component layouts state
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
    wheel: {
      position: 'center',
      scale: 1.0,
    },
  });

  // Initialize all custom hooks
  const colorSchemeHook = useColorScheme({ socket });
  const backgroundHook = useBackground({ socket });
  const weatherHook = useWeatherEffect({ socket });
  const emoteWallHook = useEmoteWall({ socket });
  const layersHook = useLayers({ socket });
  const eventLabelsHook = useEventLabels({ socket });
  const streamStatsHook = useStreamStats({
    sessionId: sessionId as string,
    socket,
  });
  const wheelsHook = useWheels({
    sessionId: sessionId as string,
    socket,
    componentLayouts,
    setComponentLayouts,
  });
  const expandedViewHook = useExpandedView();
  const alertsHook = useAlerts({ sessionId: sessionId as string });

  // Use existing hooks
  const nowPlayingVisible =
    layersHook.layers.find(l => l.id === 'nowplaying')?.visible ?? true;
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

  // Layout persistence hook (handles loading and saving)
  const persistenceHook = useLayoutPersistence({
    sessionId: sessionId as string,
    session,
    setColorScheme: colorSchemeHook.setColorScheme,
    setCustomColors: colorSchemeHook.setCustomColors,
    setFontFamily: colorSchemeHook.setFontFamily,
    setWeatherEffect: weatherHook.setWeatherEffect,
    setLayers: layersHook.setLayers,
    setComponentLayouts,
    setBackgroundImageUrl: backgroundHook.setBackgroundImageUrl,
    setBackgroundImageName: backgroundHook.setBackgroundImageName,
    setBackgroundColors: backgroundHook.setBackgroundColors,
    setBackgroundOpacity: backgroundHook.setBackgroundOpacity,
    setBackgroundBlur: backgroundHook.setBackgroundBlur,
    setStreamStatsConfig: streamStatsHook.setStreamStatsConfig,
    setStreamStatsData: streamStatsHook.setStreamStatsData,
    colorScheme: colorSchemeHook.colorScheme,
    customColors: colorSchemeHook.customColors,
    fontFamily: colorSchemeHook.fontFamily,
    weatherEffect: weatherHook.weatherEffect,
    layers: layersHook.layers,
    componentLayouts,
    paintByNumbersState: paintHook.paintByNumbersState,
  });

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

  return (
    <>
      <Head>
        <title>Dashboard - Stream Overlay System</title>
      </Head>
      <div className='min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4 md:p-8'>
        <div className='max-w-7xl mx-auto'>
          {/* Header */}
          <DashboardHeader
            sessionId={sessionId as string}
            session={session}
            isConnected={isConnected}
            saveStatus={persistenceHook.saveStatus}
            layoutName={persistenceHook.layoutName}
            onLayoutNameChange={persistenceHook.setLayoutName}
          />

          {/* Main Content */}
          {!expandedViewHook.expandedElement ? (
            /* Summary Tiles Grid */
            <div
              key='summary-grid'
              className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-zoom-in'
            >
              {/* Full Screen Effects */}

              {/* Custom Background Tile */}
              <SummaryTile
                title='Custom Background'
                subtitle={
                  backgroundHook.backgroundImageUrl
                    ? backgroundHook.backgroundImageName || 'Uploaded'
                    : 'No background'
                }
                icon={<BackgroundIcon />}
                color='pink'
                onClick={() =>
                  expandedViewHook.handleExpandElement('background')
                }
              />

              {/* Color Scheme Tile */}
              <SummaryTile
                title='Color Scheme'
                subtitle={colorSchemeHook.colorScheme}
                icon={<ColorSchemeIcon />}
                color='purple'
                onClick={() => expandedViewHook.handleExpandElement('color')}
              />

              {/* Weather Effects Tile */}
              <SummaryTile
                title='Weather Effects'
                subtitle={weatherHook.weatherEffect}
                icon={<WeatherIcon />}
                color='blue'
                isVisible={
                  layersHook.layers.find(l => l.id === 'weather')?.visible
                }
                onToggleVisibility={() => layersHook.toggleLayer('weather')}
                onClick={() => expandedViewHook.handleExpandElement('weather')}
              />

              {/* Goals & Analytics */}

              {/* Stream Alerts Tile */}
              <SummaryTile
                title='Stream Alerts'
                subtitle={
                  alertsHook.totalConfiguredCount === 0
                    ? 'Not configured'
                    : `${alertsHook.totalConfiguredCount} configured, ${alertsHook.enabledAlertsCount} enabled`
                }
                icon={<AlertsIcon />}
                color='red'
                onClick={() => expandedViewHook.handleExpandElement('alerts')}
              />

              {/* Event Labels Tile */}
              <SummaryTile
                title='Recent Events'
                subtitle='Latest follower, sub, bits, etc.'
                icon={<EventLabelsIcon />}
                color='cyan'
                isVisible={
                  layersHook.layers.find(l => l.id === 'eventlabels')?.visible
                }
                onToggleVisibility={() => layersHook.toggleLayer('eventlabels')}
                onClick={() =>
                  expandedViewHook.handleExpandElement('eventlabels')
                }
              />

              {/* Stream Stats Tile */}
              <SummaryTile
                title='Stream Stats & Goals'
                subtitle='Track goals, metrics, & sentiment'
                icon={<StreamStatsIcon />}
                color='purple'
                isVisible={
                  layersHook.layers.find(l => l.id === 'streamstats')?.visible
                }
                onToggleVisibility={() => layersHook.toggleLayer('streamstats')}
                onClick={() =>
                  expandedViewHook.handleExpandElement('streamstats')
                }
              />

              {/* Widget Components */}

              {/* Now Playing Tile */}
              <SummaryTile
                title='Now Playing'
                subtitle={
                  spotify.spotifyToken
                    ? spotify.trackTitle || 'Connected'
                    : 'Not connected'
                }
                icon={<NowPlayingIcon />}
                color='green'
                isVisible={
                  layersHook.layers.find(l => l.id === 'nowplaying')?.visible
                }
                onToggleVisibility={() => layersHook.toggleLayer('nowplaying')}
                onClick={() =>
                  expandedViewHook.handleExpandElement('nowplaying')
                }
              />

              {/* Chat Highlight Tile */}
              <SummaryTile
                title='Chat Highlight'
                subtitle={chatHook.chatHighlight ? 'Selected' : 'Inactive'}
                icon={<ChatHighlightIcon />}
                color='purple'
                isVisible={
                  layersHook.layers.find(l => l.id === 'chathighlight')?.visible
                }
                onToggleVisibility={() =>
                  layersHook.toggleLayer('chathighlight')
                }
                onClick={() =>
                  expandedViewHook.handleExpandElement('chathighlight')
                }
              />

              {/* Countdown Timers Tile */}
              <SummaryTile
                title='Countdown Timers'
                subtitle={`${timersHook.timers.length} timer${timersHook.timers.length !== 1 ? 's' : ''}`}
                icon={<CountdownIcon />}
                color='orange'
                isVisible={
                  layersHook.layers.find(l => l.id === 'countdown')?.visible
                }
                onToggleVisibility={() => layersHook.toggleLayer('countdown')}
                onClick={() =>
                  expandedViewHook.handleExpandElement('countdown')
                }
              />

              {/* Wheel Spinner Tile */}
              <SummaryTile
                title='Wheel Spinner'
                subtitle={
                  wheelsHook.wheels.find(w => w.isActive)
                    ? wheelsHook.wheels.find(w => w.isActive)!.name
                    : wheelsHook.wheels.length > 0
                      ? `${wheelsHook.wheels.length} wheel${wheelsHook.wheels.length > 1 ? 's' : ''}`
                      : 'No wheels yet'
                }
                icon={<WheelIcon />}
                color='yellow'
                isVisible={
                  layersHook.layers.find(l => l.id === 'wheel')?.visible
                }
                onToggleVisibility={() => layersHook.toggleLayer('wheel')}
                onClick={() => expandedViewHook.handleExpandElement('wheel')}
              />

              {/* Paint by Numbers Tile */}
              <SummaryTile
                title='Paint by Numbers'
                subtitle={
                  paintHook.paintByNumbersState
                    ? `${paintHook.paintByNumbersState.regions.filter(r => r.filled).length}/${paintHook.paintByNumbersState.regions.length} filled`
                    : 'Select template'
                }
                icon={<PaintByNumbersIcon />}
                color='pink'
                isVisible={
                  layersHook.layers.find(l => l.id === 'paintbynumbers')
                    ?.visible
                }
                onToggleVisibility={() =>
                  layersHook.toggleLayer('paintbynumbers')
                }
                onClick={() => expandedViewHook.handleExpandElement('paint')}
              />

              {/* Emote Wall Tile */}
              <SummaryTile
                title='Emote Wall'
                subtitle={`${emoteWallHook.emoteIntensity} intensity`}
                icon={<EmoteWallIcon />}
                color='yellow'
                onClick={() => expandedViewHook.handleExpandElement('emote')}
              />
            </div>
          ) : (
            /* Expanded Element View */
            <div
              key={`expanded-${expandedViewHook.expandedElement}`}
              className={`relative ${expandedViewHook.isExpanding ? 'animate-tile-expand' : 'animate-zoom-in'}`}
            >
              {/* Expanding placeholder - Show during expansion */}
              {expandedViewHook.isExpanding && (
                <div
                  className={`bg-linear-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-xl min-h-[400px] flex items-center justify-center`}
                >
                  <div className='w-16 h-16 border-4 border-gray-600 border-t-gray-400 rounded-full animate-spin' />
                </div>
              )}

              {/* Render expanded element - Only show after expansion */}
              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'color' && (
                  <ColorSchemeExpanded
                    colorScheme={colorSchemeHook.colorScheme}
                    customColors={colorSchemeHook.customColors}
                    fontFamily={colorSchemeHook.fontFamily}
                    onColorSchemeChange={colorSchemeHook.changeColorScheme}
                    onCustomColorsChange={
                      colorSchemeHook.handleCustomColorsChange
                    }
                    onFontFamilyChange={colorSchemeHook.handleFontFamilyChange}
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'weather' && (
                  <WeatherExpanded
                    sessionId={sessionId as string}
                    weatherEffect={weatherHook.weatherEffect}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'weather')
                        ?.visible || false
                    }
                    componentLayouts={componentLayouts}
                    onWeatherChange={weatherHook.changeWeather}
                    onToggleVisibility={() => layersHook.toggleLayer('weather')}
                    onDensityChange={density =>
                      setComponentLayouts({
                        ...componentLayouts,
                        weather: { ...componentLayouts.weather, density },
                      })
                    }
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'nowplaying' && (
                  <NowPlayingExpanded
                    spotifyToken={spotify.spotifyToken}
                    sessionId={sessionId as string}
                    trackTitle={spotify.trackTitle}
                    trackArtist={spotify.trackArtist}
                    trackAlbumArt={spotify.trackAlbumArt}
                    isPlaying={spotify.isPlaying}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'nowplaying')
                        ?.visible || false
                    }
                    componentLayouts={componentLayouts}
                    onDisconnect={spotify.disconnect}
                    onToggleVisibility={() =>
                      layersHook.toggleLayer('nowplaying')
                    }
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
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'countdown' && (
                  <CountdownExpanded
                    sessionId={sessionId as string}
                    timers={timersHook.timers}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'countdown')
                        ?.visible || false
                    }
                    isAuthenticated={!!session}
                    showTimerForm={timersHook.showTimerForm}
                    editingTimerId={timersHook.editingTimerId}
                    newTimerTitle={timersHook.newTimerTitle}
                    newTimerDescription={timersHook.newTimerDescription}
                    newTimerDate={timersHook.newTimerDate}
                    componentLayouts={componentLayouts}
                    onToggleVisibility={() =>
                      layersHook.toggleLayer('countdown')
                    }
                    onShowTimerForm={() =>
                      timersHook.setShowTimerForm(!timersHook.showTimerForm)
                    }
                    onCreateTimer={timersHook.createTimer}
                    onCancelTimerForm={timersHook.cancelTimerForm}
                    onStartEditingTimer={timersHook.startEditingTimer}
                    onDeleteTimer={timersHook.deleteTimer}
                    onToggleTimer={timersHook.toggleTimer}
                    onNewTimerTitleChange={timersHook.setNewTimerTitle}
                    onNewTimerDescriptionChange={
                      timersHook.setNewTimerDescription
                    }
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
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'emote' && (
                  <EmoteWallExpanded
                    sessionId={sessionId as string}
                    emoteInput={emoteWallHook.emoteInput}
                    emoteIntensity={emoteWallHook.emoteIntensity}
                    isConnected={isConnected}
                    onEmoteInputChange={emoteWallHook.setEmoteInput}
                    onIntensityChange={emoteWallHook.setEmoteIntensity}
                    onTrigger={emoteWallHook.triggerEmoteWall}
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'paint' && (
                  <PaintByNumbersExpanded
                    sessionId={sessionId as string}
                    paintState={paintHook.paintByNumbersState}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'paintbynumbers')
                        ?.visible || false
                    }
                    componentLayouts={componentLayouts}
                    onToggleVisibility={() =>
                      layersHook.toggleLayer('paintbynumbers')
                    }
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
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'chathighlight' && (
                  <ChatHighlightExpanded
                    sessionId={sessionId as string}
                    messages={chatHook.chatMessages}
                    currentHighlight={chatHook.chatHighlight}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'chathighlight')
                        ?.visible || false
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
                    onToggleVisibility={() =>
                      layersHook.toggleLayer('chathighlight')
                    }
                    onPositionChange={(x, y) =>
                      setComponentLayouts({
                        ...componentLayouts,
                        chatHighlight: {
                          ...componentLayouts.chatHighlight,
                          x,
                          y,
                        },
                      })
                    }
                    onWidthChange={width =>
                      setComponentLayouts({
                        ...componentLayouts,
                        chatHighlight: {
                          ...componentLayouts.chatHighlight,
                          width,
                        },
                      })
                    }
                    onScaleChange={scale =>
                      setComponentLayouts({
                        ...componentLayouts,
                        chatHighlight: {
                          ...componentLayouts.chatHighlight,
                          scale,
                        },
                      })
                    }
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'background' && (
                  <BackgroundExpanded
                    sessionId={sessionId as string}
                    backgroundImageUrl={backgroundHook.backgroundImageUrl}
                    backgroundImageName={backgroundHook.backgroundImageName}
                    backgroundColors={backgroundHook.backgroundColors}
                    backgroundOpacity={backgroundHook.backgroundOpacity}
                    backgroundBlur={backgroundHook.backgroundBlur}
                    onBackgroundChange={backgroundHook.handleBackgroundChange}
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'alerts' && (
                  <AlertsExpanded
                    sessionId={sessionId as string}
                    onClose={expandedViewHook.handleCloseExpanded}
                    onAlertsSaved={alertsHook.refetch}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'eventlabels' && (
                  <EventLabelsExpanded
                    sessionId={sessionId as string}
                    config={eventLabelsHook.eventLabelsConfig}
                    componentLayouts={componentLayouts}
                    onConfigChange={
                      eventLabelsHook.handleEventLabelsConfigChange
                    }
                    onPositionChange={(x, y) =>
                      setComponentLayouts({
                        ...componentLayouts,
                        eventLabels: {
                          position:
                            componentLayouts.eventLabels?.position ||
                            'top-right',
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
                            componentLayouts.eventLabels?.position ||
                            'top-right',
                          x: componentLayouts.eventLabels?.x || 20,
                          y: componentLayouts.eventLabels?.y || 20,
                          scale,
                        },
                      })
                    }
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'streamstats' && (
                  <StreamStatsExpanded
                    sessionId={sessionId as string}
                    config={streamStatsHook.streamStatsConfig}
                    componentLayouts={componentLayouts}
                    onConfigChange={
                      streamStatsHook.handleStreamStatsConfigChange
                    }
                    onPositionChange={(x, y) =>
                      setComponentLayouts({
                        ...componentLayouts,
                        streamStats: {
                          position:
                            componentLayouts.streamStats?.position ||
                            'top-right',
                          x,
                          y,
                          scale: componentLayouts.streamStats?.scale || 1,
                          displayMode:
                            componentLayouts.streamStats?.displayMode || 'full',
                        },
                      })
                    }
                    onScaleChange={scale =>
                      setComponentLayouts({
                        ...componentLayouts,
                        streamStats: {
                          position:
                            componentLayouts.streamStats?.position ||
                            'top-right',
                          x: componentLayouts.streamStats?.x || 20,
                          y: componentLayouts.streamStats?.y || 20,
                          scale,
                          displayMode:
                            componentLayouts.streamStats?.displayMode || 'full',
                        },
                      })
                    }
                    onDisplayModeChange={mode =>
                      setComponentLayouts({
                        ...componentLayouts,
                        streamStats: {
                          position:
                            componentLayouts.streamStats?.position ||
                            'top-right',
                          x: componentLayouts.streamStats?.x || 20,
                          y: componentLayouts.streamStats?.y || 20,
                          scale: componentLayouts.streamStats?.scale || 1,
                          displayMode: mode,
                        },
                      })
                    }
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'wheel' && (
                  <WheelExpanded
                    sessionId={sessionId as string}
                    wheels={wheelsHook.wheels}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'wheel')?.visible ||
                      false
                    }
                    componentLayouts={componentLayouts}
                    onToggleVisibility={() => layersHook.toggleLayer('wheel')}
                    onPositionChange={wheelsHook.handleWheelPositionChange}
                    onScaleChange={wheelsHook.handleWheelScaleChange}
                    onCreateWheel={wheelsHook.handleCreateWheel}
                    onUpdateWheel={wheelsHook.handleUpdateWheel}
                    onDeleteWheel={wheelsHook.handleDeleteWheel}
                    onSpinWheel={wheelsHook.handleSpinWheel}
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}
            </div>
          )}

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </>
  );
}
