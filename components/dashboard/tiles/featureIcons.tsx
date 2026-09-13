// components/dashboard/tiles/featureIcons.tsx
import type { ComponentType } from 'react';
import type { FeatureId } from '@/lib/dashboardFeatures';
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
 * Feature id -> icon. Keyed by FeatureId, so omitting one is a compile error
 * rather than a silently blank tile - which is why FeatureTile needs no
 * runtime fallback.
 *
 * Kept separate from the registry so lib/ never imports from components/ -
 * that dependency direction would be backwards, and keeping icons out is what
 * lets lib/dashboardFeatures.ts be unit-tested without React.
 */
export const FEATURE_ICONS: Record<FeatureId, ComponentType> = {
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
