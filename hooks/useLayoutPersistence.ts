// hooks/useLayoutPersistence.ts
import { useState, useEffect, useCallback } from 'react';
import { Session } from 'next-auth';
import {
  ColorScheme,
  CustomColors,
  WeatherEffect,
  ComponentLayouts,
  StreamStatsConfig,
  StreamStatsData,
  PaintByNumbersState,
} from '@/types/overlay';
import { serializePaintState } from '@/lib/paintStateManager';

interface Layer {
  id: string;
  name: string;
  visible: boolean;
}

interface UseLayoutPersistenceProps {
  sessionId: string | undefined;
  session: Session | null;
  // State setters from various hooks
  setColorScheme: (scheme: ColorScheme) => void;
  setCustomColors: (colors: CustomColors | null) => void;
  setFontFamily: (font: string) => void;
  setWeatherEffect: (effect: WeatherEffect) => void;
  setLayers: (layers: Layer[]) => void;
  setComponentLayouts: (layouts: ComponentLayouts) => void;
  setBackgroundImageUrl: (url: string | null) => void;
  setBackgroundImageName: (name: string | null) => void;
  setBackgroundColors: (colors: string | null) => void;
  setBackgroundOpacity: (opacity: number) => void;
  setBackgroundBlur: (blur: number) => void;
  setStreamStatsConfig: (config: StreamStatsConfig) => void;
  setStreamStatsData: (data: StreamStatsData) => void;
  // Current state for saving
  colorScheme: ColorScheme;
  customColors: CustomColors | null;
  fontFamily: string;
  weatherEffect: WeatherEffect;
  layers: Layer[];
  componentLayouts: ComponentLayouts;
  paintByNumbersState: PaintByNumbersState | null;
}

export function useLayoutPersistence({
  sessionId,
  session,
  setColorScheme,
  setCustomColors,
  setFontFamily,
  setWeatherEffect,
  setLayers,
  setComponentLayouts,
  setBackgroundImageUrl,
  setBackgroundImageName,
  setBackgroundColors,
  setBackgroundOpacity,
  setBackgroundBlur,
  setStreamStatsConfig,
  setStreamStatsData,
  colorScheme,
  customColors,
  fontFamily,
  weatherEffect,
  layers,
  componentLayouts,
  paintByNumbersState,
}: UseLayoutPersistenceProps) {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>(
    'saved'
  );
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [layoutName, setLayoutName] = useState<string>('My Layout');

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

          // Set layout name
          if (layout.name) {
            setLayoutName(layout.name);
          }

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
            {
              id: 'streamstats',
              name: 'Stream Stats',
              visible: layout.streamStatsVisible ?? true,
            },
            {
              id: 'wheel',
              name: 'Wheel Spinner',
              visible: layout.wheelVisible ?? true,
            },
            {
              id: 'alerts',
              name: 'Alerts',
              visible: layout.alertsVisible ?? true,
            },
            {
              id: 'tts',
              name: 'Text to Speech',
              visible: layout.ttsVisible ?? true,
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
                eventLabels: parsedLayouts.eventLabels || {
                  position: 'top-right',
                  x: 20,
                  y: 20,
                  scale: 1,
                },
                streamStats: parsedLayouts.streamStats || {
                  position: 'top-right',
                  x: 20,
                  y: 20,
                  scale: 1,
                  displayMode: 'full',
                },
                wheel: parsedLayouts.wheel || {
                  position: 'center',
                  scale: 1.0,
                },
                tts: parsedLayouts.tts || {
                  position: 'bottom-right',
                  x: 20,
                  y: 20,
                  scale: 1,
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

          // Load stream stats config
          if (layout.streamStatsConfig) {
            try {
              const parsedConfig = JSON.parse(layout.streamStatsConfig);
              setStreamStatsConfig(parsedConfig);
            } catch (error) {
              console.error('Error parsing stream stats config:', error);
            }
          }

          // Load stream stats data
          if (layout.streamStatsData) {
            try {
              const parsedData = JSON.parse(layout.streamStatsData);
              setStreamStatsData(parsedData);
            } catch (error) {
              console.error('Error parsing stream stats data:', error);
            }
          }

          setLastSaved(new Date(layout.updatedAt));
        }
      } catch (error) {
        console.error('Error loading layout:', error);
      }
    };

    loadLayout();
  }, [
    session,
    sessionId,
    setColorScheme,
    setCustomColors,
    setFontFamily,
    setWeatherEffect,
    setLayers,
    setComponentLayouts,
    setBackgroundImageUrl,
    setBackgroundImageName,
    setBackgroundColors,
    setBackgroundOpacity,
    setBackgroundBlur,
    setStreamStatsConfig,
    setStreamStatsData,
  ]);

  // Auto-save layout when settings change
  const saveLayout = useCallback(async () => {
    if (!session || !sessionId) return;

    setSaveStatus('saving');

    try {
      // Load existing saved states
      const loadResponse = await fetch(
        `/api/layouts/load?sessionId=${sessionId}`
      );
      let existingStates: Record<string, PaintByNumbersState> = {};

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
      if (paintByNumbersState) {
        serializedPaintState = serializePaintState(
          paintByNumbersState,
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
    fontFamily,
    weatherEffect,
    layers,
    componentLayouts,
    paintByNumbersState,
  ]);

  // Debounced auto-save
  useEffect(() => {
    if (!session) return;

    const timer = setTimeout(() => {
      setSaveStatus('unsaved');
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
    paintByNumbersState,
    saveLayout,
  ]);

  return {
    saveStatus,
    lastSaved,
    saveLayout,
    layoutName,
    setLayoutName,
  };
}
