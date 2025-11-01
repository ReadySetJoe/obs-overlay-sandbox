// types/overlay.ts
export type UserRole =
  | 'viewer'
  | 'subscriber'
  | 'moderator'
  | 'vip'
  | 'first-timer';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  role: UserRole;
  timestamp: number;
  color?: string;
}

export type ColorScheme =
  | 'default'
  | 'gaming'
  | 'chill'
  | 'energetic'
  | 'dark'
  | 'neon'
  // Gaming themes
  | 'cyberpunk'
  | 'retro-arcade'
  | 'fps-modern'
  // Chill themes
  | 'sunset'
  | 'ocean'
  | 'forest'
  | 'lavender'
  // Vibrant themes
  | 'synthwave'
  | 'vaporwave'
  | 'rainbow'
  | 'candy'
  // Minimal themes
  | 'monochrome'
  | 'pastel'
  | 'noir'
  // Custom
  | 'custom';

export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  gradientType: 'linear' | 'radial';
  gradientDirection: 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-tl' | 'to-br' | 'to-bl';
}

export type ColorSchemeCategory = 'all' | 'gaming' | 'chill' | 'vibrant' | 'minimal' | 'custom';

export type WeatherEffect =
  | 'none'
  | 'rain'
  | 'snow'
  | 'hearts'
  | 'stars'
  | 'bubbles'
  | 'leaves'
  | 'sakura';

export interface NowPlaying {
  title: string;
  artist: string;
  albumArt: string;
  isPlaying: boolean;
  progress?: number; // milliseconds
  duration?: number; // milliseconds
  timestamp?: number; // when this data was fetched
}

export interface SceneLayer {
  id: string;
  name: string;
  visible: boolean;
  zIndex: number;
}

export interface AudioLevel {
  level: number; // 0-100
  timestamp: number;
}

export interface CountdownTimer {
  id: string;
  title: string;
  description?: string;
  targetDate: string; // ISO string
  isActive: boolean;
}

export interface EmoteWallConfig {
  emotes: string[]; // Array of emote URLs or emoji
  duration: number; // Duration in milliseconds
  intensity: 'light' | 'medium' | 'heavy';
}

export type Position =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'custom';

export interface ChatLayout {
  position: Position;
  x: number; // offset from position anchor
  y: number; // offset from position anchor
  maxWidth: number; // max width in pixels
}

export interface NowPlayingLayout {
  position: Position;
  x: number;
  y: number;
  width: number;
  scale: number; // 0.5 to 2.0
}

export interface CountdownLayout {
  position: Position;
  x: number;
  y: number;
  scale: number; // 0.5 to 2.0
  minWidth: number;
}

export interface WeatherLayout {
  density: number; // 0.5 to 2.0
}

export interface ChatHighlightLayout {
  position: Position;
  x: number;
  y: number;
  width: number;
  scale: number; // 0.5 to 2.0
}

export interface ChatHighlight {
  message: ChatMessage;
  timestamp: number; // when it was highlighted
}

export interface PaintRegion {
  id: number;
  color: string; // template/default hex color
  pixels: [number, number][]; // [x, y] coordinates
  filled: boolean;
  filledBy?: string; // username
  filledAt?: number; // timestamp
  customColor?: string; // user-specified color (overrides template color)
}

export interface PaintTemplate {
  id: string;
  name: string;
  description: string;
  width: number; // grid width
  height: number; // grid height
  regions: PaintRegion[];
}

export interface PaintByNumbersState {
  templateId: string;
  regions: PaintRegion[];
  startedAt: number;
  completedAt?: number;
  lastFilledBy?: string;
}

export interface PaintByNumbersLayout {
  position: Position;
  x: number;
  y: number;
  scale: number;
  gridSize: number; // pixel size for each grid cell
}

export interface ComponentLayouts {
  chat: ChatLayout;
  nowPlaying: NowPlayingLayout;
  countdown: CountdownLayout;
  weather: WeatherLayout;
  chatHighlight: ChatHighlightLayout;
  paintByNumbers?: PaintByNumbersLayout;
}
