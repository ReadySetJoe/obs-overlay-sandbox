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
import CollapsibleSection from '@/components/dashboard/CollapsibleSection';
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
  TTSIcon,
  TextStyleIcon,
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
import TextToSpeechExpanded from '@/components/dashboard/expanded/TextToSpeechExpanded';
import Footer from '@/components/Footer';
import { useTextStyle } from '@/hooks/useTextStyle';
import TextStyleExpanded from '@/components/dashboard/expanded/TextStyleExpanded';

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
  const textStyleHook = useTextStyle({ socket });
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
    setFontFamily: textStyleHook.setFontFamily,
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
    fontFamily: textStyleHook.fontFamily,
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

  const getIsVisible = (layerId: string) => {
    return layersHook.layers.find(l => l.id === layerId)?.visible || false;
  };

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
            /* Summary Tiles with Collapsible Sections */
            <div key='summary-grid' className='animate-zoom-in'>
              {/* 🎨 Visual & Theming - Always Expanded */}
              <CollapsibleSection
                id='visual-theming'
                title='Visual & Theming'
                icon='🎨'
                defaultCollapsed={false}
                tileCount={3}
              >
                <SummaryTile
                  title='Color Scheme'
                  subtitle={colorSchemeHook.colorScheme}
                  icon={<ColorSchemeIcon />}
                  color='purple'
                  onClick={() => expandedViewHook.handleExpandElement('color')}
                />
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
                <SummaryTile
                  title='Text Style'
                  subtitle={textStyleHook.fontFamily}
                  icon={<TextStyleIcon />}
                  color='orange'
                  onClick={() =>
                    expandedViewHook.handleExpandElement('textstyle')
                  }
                />
              </CollapsibleSection>

              {/* 🌦️ Effects & Animations */}
              <CollapsibleSection
                id='effects-animations'
                title='Effects & Animations'
                icon='🌦️'
                defaultCollapsed={false}
                tileCount={2}
              >
                <SummaryTile
                  title='Weather Effects'
                  subtitle={weatherHook.weatherEffect}
                  icon={<WeatherIcon />}
                  color='blue'
                  isVisible={getIsVisible('weather')}
                  onToggleVisibility={() => layersHook.toggleLayer('weather')}
                  onClick={() =>
                    expandedViewHook.handleExpandElement('weather')
                  }
                />
                <SummaryTile
                  title='Emote Wall'
                  subtitle={`${emoteWallHook.emoteIntensity} intensity`}
                  icon={<EmoteWallIcon />}
                  color='yellow'
                  onClick={() => expandedViewHook.handleExpandElement('emote')}
                />
              </CollapsibleSection>

              {/* 📊 Stream Analytics */}
              <CollapsibleSection
                id='stream-analytics'
                title='Stream Analytics'
                icon='📊'
                defaultCollapsed={false}
                tileCount={2}
              >
                <SummaryTile
                  title='Stream Stats & Goals'
                  subtitle='Track goals, metrics, & sentiment'
                  icon={<StreamStatsIcon />}
                  color='purple'
                  isVisible={getIsVisible('streamstats')}
                  onToggleVisibility={() =>
                    layersHook.toggleLayer('streamstats')
                  }
                  onClick={() =>
                    expandedViewHook.handleExpandElement('streamstats')
                  }
                />
                <SummaryTile
                  title='Recent Events'
                  subtitle='Latest follower, sub, bits, etc.'
                  icon={<EventLabelsIcon />}
                  color='cyan'
                  isVisible={getIsVisible('eventlabels')}
                  onToggleVisibility={() =>
                    layersHook.toggleLayer('eventlabels')
                  }
                  onClick={() =>
                    expandedViewHook.handleExpandElement('eventlabels')
                  }
                />
              </CollapsibleSection>

              {/* 🎭 Interactive Features */}
              <CollapsibleSection
                id='interactive-features'
                title='Interactive Features'
                icon='🎭'
                defaultCollapsed={false}
                tileCount={3}
              >
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
                  isVisible={getIsVisible('wheel')}
                  onToggleVisibility={() => layersHook.toggleLayer('wheel')}
                  onClick={() => expandedViewHook.handleExpandElement('wheel')}
                />
                <SummaryTile
                  title='Paint by Numbers'
                  subtitle={
                    paintHook.paintByNumbersState
                      ? `${paintHook.paintByNumbersState.regions.filter(r => r.filled).length}/${paintHook.paintByNumbersState.regions.length} filled`
                      : 'Select template'
                  }
                  icon={<PaintByNumbersIcon />}
                  color='pink'
                  isVisible={getIsVisible('paintbynumbers')}
                  onToggleVisibility={() =>
                    layersHook.toggleLayer('paintbynumbers')
                  }
                  onClick={() => expandedViewHook.handleExpandElement('paint')}
                />
                <SummaryTile
                  title='Countdown Timers'
                  subtitle={`${timersHook.timers.length} timer${timersHook.timers.length !== 1 ? 's' : ''}`}
                  icon={<CountdownIcon />}
                  color='orange'
                  isVisible={getIsVisible('countdown')}
                  onToggleVisibility={() => layersHook.toggleLayer('countdown')}
                  onClick={() =>
                    expandedViewHook.handleExpandElement('countdown')
                  }
                />
              </CollapsibleSection>

              {/* 💬 Chat & Communication */}
              <CollapsibleSection
                id='chat-communication'
                title='Chat & Communication'
                icon='💬'
                defaultCollapsed={false}
                tileCount={3}
              >
                <SummaryTile
                  title='Chat Highlight'
                  subtitle={chatHook.chatHighlight ? 'Selected' : 'Inactive'}
                  icon={<ChatHighlightIcon />}
                  color='purple'
                  isVisible={getIsVisible('chathighlight')}
                  onToggleVisibility={() =>
                    layersHook.toggleLayer('chathighlight')
                  }
                  onClick={() =>
                    expandedViewHook.handleExpandElement('chathighlight')
                  }
                />
                <SummaryTile
                  title='Text to Speech'
                  subtitle='Voice overlay & TTS'
                  icon={<TTSIcon />}
                  color='blue'
                  isVisible={getIsVisible('tts')}
                  onToggleVisibility={() => layersHook.toggleLayer('tts')}
                  onClick={() => expandedViewHook.handleExpandElement('tts')}
                />
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
              </CollapsibleSection>

              {/* 🎵 Integrations */}
              <CollapsibleSection
                id='integrations'
                title='Integrations'
                icon='🎵'
                defaultCollapsed={false}
                tileCount={1}
              >
                <SummaryTile
                  title='Now Playing'
                  subtitle={
                    spotify.isPlaying ? spotify.trackTitle : 'Not playing'
                  }
                  icon={<NowPlayingIcon />}
                  color='green'
                  isVisible={getIsVisible('nowplaying')}
                  onToggleVisibility={() =>
                    layersHook.toggleLayer('nowplaying')
                  }
                  onClick={() =>
                    expandedViewHook.handleExpandElement('nowplaying')
                  }
                />
              </CollapsibleSection>
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
                    onColorSchemeChange={colorSchemeHook.changeColorScheme}
                    onCustomColorsChange={
                      colorSchemeHook.handleCustomColorsChange
                    }
                    onClose={expandedViewHook.handleCloseExpanded}
                  />
                )}

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'textstyle' && (
                  <TextStyleExpanded
                    fontFamily={textStyleHook.fontFamily}
                    onFontFamilyChange={textStyleHook.handleFontFamilyChange}
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
                    onToggleVisibility={() =>
                      layersHook.toggleLayer('eventlabels')
                    }
                    isVisible={
                      layersHook.layers.find(l => l.id === 'eventlabels')
                        ?.visible || false
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
                    isVisible={
                      layersHook.layers.find(l => l.id === 'streamstats')
                        ?.visible || false
                    }
                    onToggleVisibility={() =>
                      layersHook.toggleLayer('streamstats')
                    }
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

              {!expandedViewHook.isExpanding &&
                expandedViewHook.expandedElement === 'tts' && (
                  <TextToSpeechExpanded
                    sessionId={sessionId as string}
                    config={null}
                    isVisible={
                      layersHook.layers.find(l => l.id === 'tts')?.visible ||
                      false
                    }
                    componentLayouts={componentLayouts}
                    onConfigChange={config => {
                      // TTS config changes are handled within the component via API calls
                      console.log('TTS config changed:', config);
                    }}
                    onPositionChange={(x, y) =>
                      setComponentLayouts({
                        ...componentLayouts,
                        tts: {
                          ...componentLayouts.tts,
                          x,
                          y,
                          position: 'custom',
                          scale: componentLayouts.tts?.scale || 1,
                        },
                      })
                    }
                    onScaleChange={scale =>
                      setComponentLayouts({
                        ...componentLayouts,
                        tts: {
                          ...componentLayouts.tts,
                          scale,
                          position:
                            componentLayouts.tts?.position || 'bottom-right',
                        },
                      })
                    }
                    onToggleVisibility={() => layersHook.toggleLayer('tts')}
                    onClose={expandedViewHook.handleCloseExpanded}
                    socket={socket}
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
