// hooks/useThemeColors.ts
import { useMemo } from 'react';
import { ColorScheme, CustomColors } from '@/types/overlay';
import { getColorSchemePreset } from '@/lib/colorSchemes';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  // Utility variants
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;
  accentLight: string;
  accentDark: string;
  // Text colors with guaranteed contrast (for use on dark backgrounds)
  primaryText: string;
  secondaryText: string;
  accentText: string;
  // Gradient strings for CSS
  gradientBg: string; // Full gradient background
  gradientText: string; // Text gradient (for bg-clip-text)
}

/**
 * Hook to get theme colors based on the active color scheme
 * Handles both preset schemes and custom color schemes
 */
export function useThemeColors(
  colorScheme: ColorScheme,
  customColors: CustomColors | null
): ThemeColors {
  return useMemo(() => {
    let primary: string;
    let secondary: string;
    let accent: string;

    // Use custom colors if scheme is 'custom' and colors are provided
    if (colorScheme === 'custom' && customColors) {
      primary = customColors.primary;
      secondary = customColors.secondary;
      accent = customColors.accent;
    } else {
      // Get preset colors
      const preset = getColorSchemePreset(colorScheme);
      if (preset) {
        primary = preset.preview.primary;
        secondary = preset.preview.secondary;
        accent = preset.preview.accent;
      } else {
        // Fallback to default scheme
        const defaultPreset = getColorSchemePreset('default');
        primary = defaultPreset?.preview.primary || '#1e3a8a';
        secondary = defaultPreset?.preview.secondary || '#581c87';
        accent = defaultPreset?.preview.accent || '#7c3aed';
      }
    }

    // Generate lighter and darker variants
    const primaryLight = lightenColor(primary, 20);
    const primaryDark = darkenColor(primary, 20);
    const secondaryLight = lightenColor(secondary, 20);
    const secondaryDark = darkenColor(secondary, 20);
    const accentLight = lightenColor(accent, 20);
    const accentDark = darkenColor(accent, 20);

    // Generate text colors with guaranteed contrast on dark backgrounds
    // If the color is too dark, use a much lighter version; otherwise use the light variant
    // For very dark colors (luminance < 0.1), lighten by 80% for maximum visibility
    const primaryLuminance = getLuminance(primary);
    const secondaryLuminance = getLuminance(secondary);
    const accentLuminance = getLuminance(accent);

    const primaryText =
      primaryLuminance < 0.1
        ? lightenColor(primary, 80)
        : isColorDark(primary)
          ? lightenColor(primary, 60)
          : primaryLight;
    const secondaryText =
      secondaryLuminance < 0.1
        ? lightenColor(secondary, 80)
        : isColorDark(secondary)
          ? lightenColor(secondary, 60)
          : secondaryLight;
    const accentText =
      accentLuminance < 0.1
        ? lightenColor(accent, 80)
        : isColorDark(accent)
          ? lightenColor(accent, 60)
          : accentLight;

    // Generate gradient strings
    let gradientBg: string;
    let gradientText: string;

    if (colorScheme === 'custom' && customColors) {
      // Use custom gradient settings
      const direction = customColors.gradientDirection;
      const type = customColors.gradientType;

      if (type === 'linear') {
        const directionMap: Record<string, string> = {
          'to-r': 'to right',
          'to-l': 'to left',
          'to-t': 'to top',
          'to-b': 'to bottom',
          'to-tr': 'to top right',
          'to-tl': 'to top left',
          'to-br': 'to bottom right',
          'to-bl': 'to bottom left',
        };
        const cssDirection = directionMap[direction] || 'to bottom right';
        gradientBg = `linear-gradient(${cssDirection}, ${primary}, ${secondary})`;
        // Use text-safe colors for gradient text to ensure visibility
        gradientText = `linear-gradient(${cssDirection}, ${primaryText}, ${secondaryText})`;
      } else {
        gradientBg = `radial-gradient(circle, ${primary}, ${secondary})`;
        // Use text-safe colors for gradient text to ensure visibility
        gradientText = `radial-gradient(circle, ${primaryText}, ${secondaryText})`;
      }
    } else {
      // Use preset gradient (default direction)
      gradientBg = `linear-gradient(to bottom right, ${primary}, ${secondary})`;
      // Use text-safe colors for gradient text to ensure visibility on dark backgrounds
      gradientText = `linear-gradient(to right, ${primaryText}, ${secondaryText})`;
    }

    return {
      primary,
      secondary,
      accent,
      primaryLight,
      primaryDark,
      secondaryLight,
      secondaryDark,
      accentLight,
      accentDark,
      primaryText,
      secondaryText,
      accentText,
      gradientBg,
      gradientText,
    };
  }, [colorScheme, customColors]);
}

/**
 * Calculate the relative luminance of a color
 * Returns value between 0 (darkest) and 1 (lightest)
 */
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;

  // Apply gamma correction
  const [rs, gs, bs] = [r, g, b].map(c => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  // Calculate relative luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Check if a color is considered "dark" (luminance < 0.3)
 */
function isColorDark(hex: string): boolean {
  return getLuminance(hex) < 0.3;
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);

  const R = Math.min(255, ((num >> 16) & 0xff) + amt);
  const G = Math.min(255, ((num >> 8) & 0xff) + amt);
  const B = Math.min(255, (num & 0xff) + amt);

  return '#' + ((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1);
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);

  const R = Math.max(0, ((num >> 16) & 0xff) - amt);
  const G = Math.max(0, ((num >> 8) & 0xff) - amt);
  const B = Math.max(0, (num & 0xff) - amt);

  return '#' + ((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1);
}

/**
 * Convert hex color to rgba with specified alpha
 */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
