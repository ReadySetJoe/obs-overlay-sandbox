// components/dashboard/tiles/featureIcons.tsx
import type { ComponentType } from 'react';
import {
  AlertsIcon,
  BackgroundIcon,
  ChatHighlightIcon,
  ColorSchemeIcon,
  CountdownIcon,
  EmoteWallIcon,
  EventLabelsIcon,
  NowPlayingIcon,
  PaintByNumbersIcon,
  StreamStatsIcon,
  TTSIcon,
  TextStyleIcon,
  WeatherIcon,
  WheelIcon,
} from './TileIcons';

/**
 * Feature id -> icon. Keys must match lib/dashboardFeatures.ts ids; FeatureTile
 * falls back to null rather than crashing if one is missing, and the grid swap
 * asserts every registry id has an entry here.
 *
 * Kept separate from the registry so lib/ never imports from components/ -
 * that dependency direction would be backwards, and keeping icons out is what
 * lets lib/dashboardFeatures.ts be unit-tested without React.
 */
export const FEATURE_ICONS: Record<string, ComponentType> = {
  alerts: AlertsIcon,
  eventlabels: EventLabelsIcon,
  chathighlight: ChatHighlightIcon,
  tts: TTSIcon,
  wheel: WheelIcon,
  paint: PaintByNumbersIcon,
  streamstats: StreamStatsIcon,
  countdown: CountdownIcon,
  nowplaying: NowPlayingIcon,
  weather: WeatherIcon,
  emote: EmoteWallIcon,
  color: ColorSchemeIcon,
  background: BackgroundIcon,
  textstyle: TextStyleIcon,
};
