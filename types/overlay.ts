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
  | 'custom';

export type WeatherEffect = 'none' | 'rain' | 'snow' | 'particles' | 'confetti';

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
