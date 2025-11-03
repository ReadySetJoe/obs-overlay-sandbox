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
  gradientDirection:
    | 'to-r'
    | 'to-l'
    | 'to-t'
    | 'to-b'
    | 'to-tr'
    | 'to-tl'
    | 'to-br'
    | 'to-bl';
}

export type ColorSchemeCategory =
  | 'all'
  | 'gaming'
  | 'chill'
  | 'vibrant'
  | 'minimal'
  | 'custom';

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
  imageUrl?: string; // Optional: for custom templates
  thumbnailUrl?: string | null; // Optional: for custom templates
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

export interface EventLabelsLayout {
  position: Position;
  x: number;
  y: number;
  scale: number; // 0.5 to 2.0
}

export interface ComponentLayouts {
  chat: ChatLayout;
  nowPlaying: NowPlayingLayout;
  countdown: CountdownLayout;
  weather: WeatherLayout;
  chatHighlight: ChatHighlightLayout;
  paintByNumbers?: PaintByNumbersLayout;
  eventLabels?: EventLabelsLayout;
  streamStats?: StreamStatsLayout;
  wheel?: WheelLayout;
}

// Alert types
export type AlertEventType = 'follow' | 'sub' | 'bits' | 'raid' | 'giftsub';

export type AlertAnimationType =
  | 'slide-down'
  | 'slide-up'
  | 'bounce'
  | 'fade'
  | 'zoom'
  | 'spin'
  | 'wiggle'
  | 'flip'
  | 'rubber-band'
  | 'swing'
  | 'tada';

export type AlertPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface AlertConfig {
  id: string;
  layoutId: string;
  eventType: AlertEventType;

  // Visual settings
  enabled: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  animationType: AlertAnimationType;
  duration: number; // seconds
  position: AlertPosition;

  // Audio settings
  soundUrl?: string;
  soundPublicId?: string;
  volume: number; // 0.0 to 1.0

  // Message template
  messageTemplate: string;

  // Font and color customization
  fontSize: number; // pixels
  textColor: string;
  textShadow: boolean;
  showBackground: boolean;
}

export interface AlertEvent {
  eventType: AlertEventType;
  username: string;
  amount?: number; // for bits
  count?: number; // for raid
  message?: string; // for bits/subs
  tier?: number; // for subs (1, 2, 3)
  timestamp: number;
}

// Event Labels (Recent Events Display)
export interface EventLabelsData {
  latestFollower?: string;
  latestSub?: string;
  latestBits?: {
    username: string;
    amount: number;
  };
  latestRaid?: {
    username: string;
    count: number;
  };
  latestGiftSub?: {
    gifter: string;
    recipient?: string;
  };
}

export interface EventLabelsConfig {
  showFollower: boolean;
  showSub: boolean;
  showBits: boolean;
  showRaid: boolean;
  showGiftSub: boolean;
  followerLabel: string;
  subLabel: string;
  bitsLabel: string;
  raidLabel: string;
  giftSubLabel: string;
}

// Stream Stats & Goals
export interface StreamStatsConfig {
  // Goals
  followerGoal: number;
  subGoal: number;
  bitsGoal: number;

  // Visible metrics
  showFollowerGoal: boolean;
  showSubGoal: boolean;
  showBitsGoal: boolean;
  showTotalMessages: boolean;
  showUniqueChatters: boolean;
  showMessagesPerMinute: boolean;
  showMostActiveChatter: boolean;
  showPositivityScore: boolean;
  showNicestChatter: boolean;

  // Auto-reset on stream start
  resetOnStream: boolean;
}

export interface StreamStatsData {
  // Goal progress (current counts)
  currentFollowers: number;
  currentSubs: number;
  currentBits: number;

  // Chat metrics
  totalMessages: number;
  uniqueChatters: number;
  messagesPerMinute: number;
  mostActiveChatter?: string;
  mostActiveChatterCount: number;

  // Sentiment metrics
  overallPositivityScore: number; // Average sentiment score
  nicestChatter?: string;
  nicestChatterScore: number;

  // Tracking
  streamStartTime?: string; // ISO timestamp
  lastMessageTime?: string; // ISO timestamp for MPM calculation
}

export interface ChatterSentiment {
  username: string;
  displayName?: string;
  messageCount: number;
  averageSentiment: number;
  positiveMessages: number;
  negativeMessages: number;
  neutralMessages: number;
  lastMessageAt: string; // ISO timestamp
}

export interface StreamStatsLayout {
  position: Position;
  x: number;
  y: number;
  scale: number; // 0.5 to 2.0
  displayMode: 'compact' | 'full' | 'goals-only' | 'metrics-only';
}

// Wheel Spinner
export type WheelPosition = 'center' | 'top-center' | 'bottom-center';

export interface WheelSegment {
  label: string;
  color: string;
  weight?: number; // Optional: for weighted probability (default 1)
}

export interface WheelConfig {
  id: string;
  layoutId: string;
  name: string;
  segments: WheelSegment[];
  isActive: boolean;

  // Visual settings
  position: WheelPosition;
  scale: number; // 0.5 to 2.0
  spinDuration: number; // seconds (3-10)

  // Audio settings
  soundEnabled: boolean;
  soundVolume: number; // 0.0 to 1.0
}

export interface WheelLayout {
  position: WheelPosition;
  scale: number; // 0.5 to 2.0
}

export interface WheelSpinEvent {
  wheelId: string;
  winningIndex: number;
  winningLabel: string;
  timestamp: number;
}
