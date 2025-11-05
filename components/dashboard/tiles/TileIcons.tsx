// components/dashboard/tiles/TileIcons.tsx
// Shared icon components for dashboard tiles and expanded views

import {
  MessageSquare,
  Clock,
  Palette,
  Image,
  Cloud,
  Smile,
  Paintbrush,
  Bell,
  BarChart3,
  TrendingUp,
  CircleDot,
  Music,
  Volume2,
} from 'lucide-react';

interface GenericTileIconProps {
  gradientFrom: string;
  gradientTo: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const GenericTileIcon = ({
  icon: Icon,
  gradientFrom,
  gradientTo,
}: GenericTileIconProps) => (
  <div
    className={`w-10 h-10 bg-linear-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center`}
  >
    <Icon />
  </div>
);

export const ChatHighlightIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-purple-500',
  gradientTo: 'to-indigo-500',
  icon: MessageSquare,
});

export const NowPlayingIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-green-500',
  gradientTo: 'to-emerald-500',
  icon: Music,
});

export const CountdownIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-orange-500',
  gradientTo: 'to-red-500',
  icon: Clock,
});

export const ColorSchemeIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-violet-500',
  gradientTo: 'to-purple-500',
  icon: Palette,
});

export const BackgroundIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-pink-500',
  gradientTo: 'to-rose-500',
  icon: Image,
});

export const WeatherIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-sky-400',
  gradientTo: 'to-blue-500',
  icon: Cloud,
});

export const EmoteWallIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-yellow-400',
  gradientTo: 'to-orange-500',
  icon: Smile,
});

export const PaintByNumbersIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-rose-500',
  gradientTo: 'to-pink-500',
  icon: Paintbrush,
});

export const AlertsIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-red-500',
  gradientTo: 'to-rose-500',
  icon: Bell,
});

export const EventLabelsIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-teal-500',
  gradientTo: 'to-cyan-500',
  icon: BarChart3,
});

export const StreamStatsIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-indigo-500',
  gradientTo: 'to-purple-500',
  icon: TrendingUp,
});

export const WheelIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-amber-500',
  gradientTo: 'to-yellow-500',
  icon: CircleDot,
});

export const TTSIcon = GenericTileIcon.bind(null, {
  gradientFrom: 'from-blue-500',
  gradientTo: 'to-indigo-500',
  icon: Volume2,
});
