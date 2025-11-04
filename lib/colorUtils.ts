// lib/colorUtils.ts

/**
 * Common CSS color names mapped to hex codes
 */
const CSS_COLOR_NAMES: Record<string, string> = {
  // Reds
  red: '#FF0000',
  darkred: '#8B0000',
  crimson: '#DC143C',
  pink: '#FFC0CB',
  hotpink: '#FF69B4',
  deeppink: '#FF1493',

  // Oranges
  orange: '#FFA500',
  darkorange: '#FF8C00',
  coral: '#FF7F50',
  tomato: '#FF6347',

  // Yellows
  yellow: '#FFFF00',
  gold: '#FFD700',
  khaki: '#F0E68C',

  // Greens
  green: '#008000',
  lime: '#00FF00',
  darkgreen: '#006400',
  lightgreen: '#90EE90',
  springgreen: '#00FF7F',
  aquamarine: '#7FFFD4',

  // Blues
  blue: '#0000FF',
  darkblue: '#00008B',
  lightblue: '#ADD8E6',
  cyan: '#00FFFF',
  aqua: '#00FFFF',
  turquoise: '#40E0D0',
  skyblue: '#87CEEB',
  navy: '#000080',

  // Purples
  purple: '#800080',
  indigo: '#4B0082',
  violet: '#EE82EE',
  magenta: '#FF00FF',
  orchid: '#DA70D6',
  plum: '#DDA0DD',

  // Browns
  brown: '#A52A2A',
  tan: '#D2B48C',
  sienna: '#A0522D',

  // Grays
  white: '#FFFFFF',
  black: '#000000',
  gray: '#808080',
  grey: '#808080',
  silver: '#C0C0C0',
  darkgray: '#A9A9A9',
  lightgray: '#D3D3D3',
};

/**
 * Validates if a string is a valid hex color code
 */
function isValidHexColor(color: string): boolean {
  return /^#([0-9A-F]{3}){1,2}$/i.test(color);
}

/**
 * Normalizes a 3-digit hex code to 6 digits
 * Example: #F0A -> #FF00AA
 */
function normalizeHexColor(hex: string): string {
  if (hex.length === 4) {
    return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex.toUpperCase();
}

/**
 * Validates and normalizes a color input (name or hex code)
 * Returns normalized hex code or null if invalid
 */
export function parseColor(input: string | undefined): string | null {
  if (!input) return null;

  const trimmed = input.trim().toLowerCase();

  // Check if it's a color name
  if (CSS_COLOR_NAMES[trimmed]) {
    return CSS_COLOR_NAMES[trimmed];
  }

  // Check if it's a hex code (with or without #)
  const hex = trimmed.startsWith('#') ? trimmed : '#' + trimmed;

  if (isValidHexColor(hex)) {
    return normalizeHexColor(hex);
  }

  // Invalid color
  return null;
}

/**
 * Returns a list of supported color names for display
 */
export function getSupportedColorNames(): string[] {
  return Object.keys(CSS_COLOR_NAMES).sort();
}
