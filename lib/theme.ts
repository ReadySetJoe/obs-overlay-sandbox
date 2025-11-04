// lib/theme.ts
// Centralized color theme for dashboard components
// Maps color names to complete Tailwind class strings for JIT compiler detection

export type ThemeColor =
  | 'pink'
  | 'purple'
  | 'blue'
  | 'red'
  | 'cyan'
  | 'green'
  | 'orange'
  | 'yellow';

export const colorClasses: Record<
  ThemeColor,
  {
    bg: string;
    hoverBorder: string;
  }
> = {
  pink: {
    bg: 'bg-pink-500',
    hoverBorder: 'hover:border-pink-500/50',
  },
  purple: {
    bg: 'bg-purple-500',
    hoverBorder: 'hover:border-purple-500/50',
  },
  blue: {
    bg: 'bg-blue-500',
    hoverBorder: 'hover:border-blue-500/50',
  },
  red: {
    bg: 'bg-red-500',
    hoverBorder: 'hover:border-red-500/50',
  },
  cyan: {
    bg: 'bg-cyan-500',
    hoverBorder: 'hover:border-cyan-500/50',
  },
  green: {
    bg: 'bg-green-500',
    hoverBorder: 'hover:border-green-500/50',
  },
  orange: {
    bg: 'bg-orange-500',
    hoverBorder: 'hover:border-orange-500/50',
  },
  yellow: {
    bg: 'bg-yellow-500',
    hoverBorder: 'hover:border-yellow-500/50',
  },
};
