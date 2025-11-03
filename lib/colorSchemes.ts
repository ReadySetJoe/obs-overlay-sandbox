import { ColorScheme, ColorSchemeCategory } from '@/types/overlay';

export interface ColorSchemePreset {
  id: ColorScheme;
  name: string;
  category: ColorSchemeCategory;
  description: string;
  gradient: string; // Tailwind classes
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export const colorSchemePresets: ColorSchemePreset[] = [
  // Default/General
  {
    id: 'default',
    name: 'Default',
    category: 'all',
    description: 'Classic blue and purple gradient',
    gradient: 'from-blue-900/20 to-purple-900/20',
    preview: { primary: '#1e3a8a', secondary: '#581c87', accent: '#7c3aed' },
  },
  {
    id: 'dark',
    name: 'Dark',
    category: 'minimal',
    description: 'Pure dark minimalist theme',
    gradient: 'from-gray-900/20 to-black/20',
    preview: { primary: '#111827', secondary: '#000000', accent: '#374151' },
  },

  // Gaming Themes
  {
    id: 'gaming',
    name: 'Gaming',
    category: 'gaming',
    description: 'Bold red and orange for action',
    gradient: 'from-red-900/20 to-orange-900/20',
    preview: { primary: '#7f1d1d', secondary: '#7c2d12', accent: '#ea580c' },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    category: 'gaming',
    description: 'Neon pink and cyan future vibes',
    gradient: 'from-fuchsia-900/20 via-purple-900/20 to-cyan-900/20',
    preview: { primary: '#701a75', secondary: '#581c87', accent: '#06b6d4' },
  },
  {
    id: 'retro-arcade',
    name: 'Retro Arcade',
    category: 'gaming',
    description: 'Classic 80s arcade colors',
    gradient: 'from-yellow-900/20 via-red-900/20 to-pink-900/20',
    preview: { primary: '#713f12', secondary: '#7f1d1d', accent: '#be123c' },
  },
  {
    id: 'fps-modern',
    name: 'FPS Modern',
    category: 'gaming',
    description: 'Tactical military green and gray',
    gradient: 'from-slate-900/20 via-green-900/20 to-gray-900/20',
    preview: { primary: '#0f172a', secondary: '#14532d', accent: '#22c55e' },
  },

  // Chill Themes
  {
    id: 'chill',
    name: 'Chill',
    category: 'chill',
    description: 'Relaxing cyan and purple',
    gradient: 'from-cyan-900/20 to-purple-900/20',
    preview: { primary: '#164e63', secondary: '#581c87', accent: '#a78bfa' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    category: 'chill',
    description: 'Warm orange to pink sunset',
    gradient: 'from-orange-900/20 via-red-900/20 to-pink-900/20',
    preview: { primary: '#7c2d12', secondary: '#7f1d1d', accent: '#fda4af' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    category: 'chill',
    description: 'Deep blue ocean depths',
    gradient: 'from-blue-900/20 via-cyan-900/20 to-teal-900/20',
    preview: { primary: '#1e3a8a', secondary: '#164e63', accent: '#14b8a6' },
  },
  {
    id: 'forest',
    name: 'Forest',
    category: 'chill',
    description: 'Natural green forest',
    gradient: 'from-green-900/20 via-emerald-900/20 to-teal-900/20',
    preview: { primary: '#14532d', secondary: '#064e3b', accent: '#34d399' },
  },
  {
    id: 'lavender',
    name: 'Lavender',
    category: 'chill',
    description: 'Soft purple lavender fields',
    gradient: 'from-purple-900/20 via-violet-900/20 to-pink-900/20',
    preview: { primary: '#581c87', secondary: '#4c1d95', accent: '#d8b4fe' },
  },

  // Vibrant Themes
  {
    id: 'energetic',
    name: 'Energetic',
    category: 'vibrant',
    description: 'High energy orange and pink',
    gradient: 'from-orange-900/20 to-pink-900/20',
    preview: { primary: '#7c2d12', secondary: '#831843', accent: '#fb923c' },
  },
  {
    id: 'neon',
    name: 'Neon',
    category: 'vibrant',
    description: 'Electric neon cyan and magenta',
    gradient: 'from-cyan-500/20 to-fuchsia-500/20',
    preview: { primary: '#06b6d4', secondary: '#c026d3', accent: '#e879f9' },
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    category: 'vibrant',
    description: 'Retro 80s synthwave aesthetic',
    gradient: 'from-pink-500/20 via-purple-500/20 to-indigo-500/20',
    preview: { primary: '#ec4899', secondary: '#a855f7', accent: '#6366f1' },
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    category: 'vibrant',
    description: 'Dreamy pastel vaporwave',
    gradient: 'from-pink-400/20 via-purple-400/20 to-cyan-400/20',
    preview: { primary: '#f472b6', secondary: '#c084fc', accent: '#22d3ee' },
  },
  {
    id: 'rainbow',
    name: 'Rainbow',
    category: 'vibrant',
    description: 'Full spectrum rainbow',
    gradient:
      'from-red-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 to-purple-500/20',
    preview: { primary: '#ef4444', secondary: '#3b82f6', accent: '#a855f7' },
  },
  {
    id: 'candy',
    name: 'Candy',
    category: 'vibrant',
    description: 'Sweet candy pink and blue',
    gradient: 'from-pink-400/20 via-rose-400/20 to-blue-400/20',
    preview: { primary: '#f472b6', secondary: '#fb7185', accent: '#60a5fa' },
  },

  // Minimal Themes
  {
    id: 'monochrome',
    name: 'Monochrome',
    category: 'minimal',
    description: 'Clean black and white',
    gradient: 'from-gray-800/20 to-gray-900/20',
    preview: { primary: '#1f2937', secondary: '#111827', accent: '#6b7280' },
  },
  {
    id: 'pastel',
    name: 'Pastel',
    category: 'minimal',
    description: 'Soft pastel colors',
    gradient: 'from-purple-200/20 via-pink-200/20 to-blue-200/20',
    preview: { primary: '#e9d5ff', secondary: '#fbcfe8', accent: '#bfdbfe' },
  },
  {
    id: 'noir',
    name: 'Noir',
    category: 'minimal',
    description: 'Film noir black and white',
    gradient: 'from-black/20 via-gray-900/20 to-gray-800/20',
    preview: { primary: '#000000', secondary: '#111827', accent: '#4b5563' },
  },
];

export function getColorSchemesByCategory(
  category: ColorSchemeCategory
): ColorSchemePreset[] {
  if (category === 'all') {
    return colorSchemePresets;
  }
  return colorSchemePresets.filter(preset => preset.category === category);
}

export function getColorSchemePreset(
  id: ColorScheme
): ColorSchemePreset | undefined {
  return colorSchemePresets.find(preset => preset.id === id);
}

export const categoryInfo: Record<
  ColorSchemeCategory,
  { name: string; icon: string; description: string }
> = {
  all: {
    name: 'All Themes',
    icon: '🎨',
    description: 'Browse all available color schemes',
  },
  gaming: {
    name: 'Gaming',
    icon: '🎮',
    description: 'Bold, energetic themes for gaming streams',
  },
  chill: {
    name: 'Chill',
    icon: '🌊',
    description: 'Relaxing, calming color palettes',
  },
  vibrant: {
    name: 'Vibrant',
    icon: '⚡',
    description: 'High-energy, colorful themes',
  },
  minimal: {
    name: 'Minimal',
    icon: '✨',
    description: 'Clean, simple color schemes',
  },
  custom: {
    name: 'Custom',
    icon: '🎨',
    description: 'Create your own color scheme',
  },
};
