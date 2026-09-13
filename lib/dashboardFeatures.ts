import type { ThemeColor } from '@/lib/theme';

/**
 * Dashboard feature categories, in render order.
 *
 * Chosen to be even (2-3 features each) and honest about what things are. The
 * previous grouping was 3-2-2-3-3-1 and arbitrary: "Integrations" held exactly
 * one feature, Countdown Timers sat under "Interactive Features" despite being
 * purely informational, and Stream Alerts was filed under "Chat".
 *
 * `appearance` is last on purpose - theme, background and font are configured
 * before streaming and never touched live.
 */
export const CATEGORY_ORDER = [
  'alerts-events',
  'chat',
  'viewer-games',
  'readouts',
  'ambience',
  'appearance',
] as const;

export type FeatureCategory = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  'alerts-events': 'Alerts & Events',
  chat: 'Chat',
  'viewer-games': 'Viewer Games',
  readouts: 'Readouts',
  ambience: 'Ambience',
  appearance: 'Appearance',
};

export interface DashboardFeature {
  /**
   * Stable key. Deliberately identical to the string passed to
   * useExpandedView's handleExpandElement, so the expanded-panel dispatch in
   * pages/dashboard/[sessionId].tsx needs no changes.
   */
  id: string;
  /** Label shown on the tile. */
  name: string;
  category: FeatureCategory;
  /**
   * Layer id for the visibility toggle, or null when the feature has none.
   *
   * Four features have none: colour scheme, background and text style are
   * global appearance settings rather than overlay layers, and the emote wall
   * is fire-only - it has no persistent visible state to toggle.
   *
   * Note 'chat' is never used here. hooks/useLayers.ts defines it and it is
   * persisted as layout.chatVisible, but no overlay page renders anything
   * gated on it, so a toggle would do nothing.
   */
  layerId: string | null;
  color: ThemeColor;
}

export const DASHBOARD_FEATURES: DashboardFeature[] = [
  // Alerts & Events
  {
    id: 'alerts',
    name: 'Alerts',
    category: 'alerts-events',
    layerId: 'alerts',
    color: 'red',
  },
  {
    id: 'eventlabels',
    name: 'Recent Events',
    category: 'alerts-events',
    layerId: 'eventlabels',
    color: 'yellow',
  },

  // Chat
  {
    id: 'chathighlight',
    name: 'Chat Highlight',
    category: 'chat',
    layerId: 'chathighlight',
    color: 'cyan',
  },
  {
    id: 'tts',
    name: 'Text to Speech',
    category: 'chat',
    layerId: 'tts',
    color: 'blue',
  },

  // Viewer Games
  {
    id: 'wheel',
    name: 'Wheel Spinner',
    category: 'viewer-games',
    layerId: 'wheel',
    color: 'pink',
  },
  {
    id: 'paint',
    name: 'Paint by Numbers',
    category: 'viewer-games',
    layerId: 'paintbynumbers',
    color: 'purple',
  },

  // Readouts
  {
    id: 'streamstats',
    name: 'Stream Stats',
    category: 'readouts',
    layerId: 'streamstats',
    color: 'green',
  },
  {
    id: 'countdown',
    name: 'Countdown Timers',
    category: 'readouts',
    layerId: 'countdown',
    color: 'orange',
  },
  {
    id: 'nowplaying',
    name: 'Now Playing',
    category: 'readouts',
    layerId: 'nowplaying',
    color: 'green',
  },

  // Ambience
  {
    id: 'weather',
    name: 'Weather Effects',
    category: 'ambience',
    layerId: 'weather',
    color: 'cyan',
  },
  {
    id: 'emote',
    name: 'Emote Wall',
    category: 'ambience',
    layerId: null,
    color: 'yellow',
  },

  // Appearance
  {
    id: 'color',
    name: 'Color Scheme',
    category: 'appearance',
    layerId: null,
    color: 'purple',
  },
  {
    id: 'background',
    name: 'Custom Background',
    category: 'appearance',
    layerId: null,
    color: 'pink',
  },
  {
    id: 'textstyle',
    name: 'Text Style',
    category: 'appearance',
    layerId: null,
    color: 'orange',
  },
];

/** Features in a category, in registry order. */
export function featuresByCategory(
  category: FeatureCategory
): DashboardFeature[] {
  return DASHBOARD_FEATURES.filter(f => f.category === category);
}
