// lib/paintTemplates.ts
import { PaintTemplate, PaintRegion } from '@/types/overlay';

/**
 * Helper function to create a template from a pixel grid and color map
 * @param grid - Array of strings where each character represents a region number (0-9, A-Z for regions 0-35)
 * @param colorMap - Map of region number to hex color
 * @returns Array of PaintRegions
 */
function createTemplateFromGrid(
  grid: string[],
  colorMap: Record<string, string>
): PaintRegion[] {
  const regionPixels: Record<string, [number, number][]> = {};

  // Parse the grid and collect pixels for each region
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const char = row[x];
      if (char !== ' ' && char !== '.') {
        if (!regionPixels[char]) {
          regionPixels[char] = [];
        }
        regionPixels[char].push([x, y]);
      }
    }
  });

  // Convert to PaintRegion array
  const regions: PaintRegion[] = [];
  Object.entries(regionPixels).forEach(([char, pixels]) => {
    if (colorMap[char]) {
      regions.push({
        id: parseInt(char, 36), // Supports 0-9, then A-Z as 10-35
        color: colorMap[char],
        pixels,
        filled: false,
      });
    }
  });

  // Sort by ID
  return regions.sort((a, b) => a.id - b.id);
}

/**
 * Simple Heart Template (32x32)
 * 3 regions for easy completion
 */
const heartTemplate: PaintTemplate = {
  id: 'heart',
  name: 'Heart',
  description: 'A simple heart - perfect for showing some love!',
  width: 32,
  height: 32,
  regions: createTemplateFromGrid(
    [
      '                                ', // Row 1 (32 chars)
      '                                ', // Row 2
      '        111111    111111        ', // Row 3 - Outline
      '       11111111 11111111        ', // Row 4
      '      111111111111111111        ', // Row 5
      '      1115555511115555511        ', // Row 6 - Highlights
      '     11555555555555555511       ', // Row 7
      '     115555555555555555511      ', // Row 8
      '     115533333333333333511      ', // Row 9 - Fill
      '     153333333333333333331      ', // Row 10
      '     133333333333333333331      ', // Row 11
      '     133333333333333333331      ', // Row 12
      '     133333333333333333331      ', // Row 13
      '     133333333333333333331      ', // Row 14
      '     133333333333333333331      ', // Row 15
      '      1333333333333333331       ', // Row 16
      '      1333333333333333331       ', // Row 17
      '       133333333333333331       ', // Row 18
      '       133333333333333331       ', // Row 19
      '        1333333333333331        ', // Row 20
      '        1333333333333331        ', // Row 21
      '         13333333333331         ', // Row 22
      '         13333333333331         ', // Row 23
      '          133333333331          ', // Row 24
      '          133333333331          ', // Row 25
      '           1333333331           ', // Row 26
      '            13333331            ', // Row 27
      '             133331             ', // Row 28
      '              1331              ', // Row 29
      '               131              ', // Row 30
      '                1               ', // Row 31 - The tip!
      '                                ', // Row 32
    ],
    {
      '1': '#C62828', // Dark red outline (merged from 1 and 2)
      '3': '#F44336', // Bright red fill (merged from 3 and 4)
      '5': '#FFCDD2', // Light pink highlight (merged from 5 and 6)
    }
  ),
};

/**
 * Pokeball Template (32x32)
 * 4 regions for a classic pokeball design
 */
const pokeballTemplate: PaintTemplate = {
  id: 'pokeball',
  name: 'Pokeball',
  description: 'Gotta paint them all! A classic pokeball design.',
  width: 32,
  height: 32,
  regions: createTemplateFromGrid(
    [
      '                                ', // Row 1 (32 chars)
      '                                ', // Row 2
      '                                ', // Row 3
      '                                ', // Row 4
      '        1111111111111111        ', // Row 5 - Outline (1)
      '       11111111111111111111      ', // Row 6
      '      1122222222222222221111    ', // Row 7 - Red Top (2)
      '     11222222222222222222111    ', // Row 8
      '    112222222222222222222211    ', // Row 9
      '    122222222222222222222221    ', // Row 10
      '   1222222222222222222222221    ', // Row 11
      '   1222222222222222222222221    ', // Row 12
      '  12222222222222222222222221    ', // Row 13
      '  12222222222222222222222221    ', // Row 14
      '  12222222222222222222222221    ', // Row 15
      ' 1111111111111111111111111111   ', // Row 16 - Center Black Line (1)
      ' 1111111111111111111111111111   ', // Row 17
      '  13333333333333333333333331    ', // Row 18 - White Bottom (3)
      '  13333333333333333333333331    ', // Row 19
      '  13333333333333333333333331    ', // Row 20
      '   133333333333333333333331    ', // Row 21
      '   133333333333333333333331    ', // Row 22
      '    1333333333333333333331      ', // Row 23
      '    1333333333333333333331      ', // Row 24
      '     11333333333333333311       ', // Row 25
      '      111111111111111111        ', // Row 26
      '                                ', // Row 27
      '                                ', // Row 28
      '                                ', // Row 29
      '                                ', // Row 30
      '                                ', // Row 31
      '                                ', // Row 32
    ],
    {
      '1': '#000000', // Black outline and center divider
      '2': '#EF5350', // Red top half (merged from 2 and 3)
      '3': '#FAFAFA', // White bottom half (merged from 4 and 5)
      // I removed the center button color for now to simplify the geometry.
    }
  ),
};

/**
 * All available templates
 */
export const paintTemplates: PaintTemplate[] = [
  heartTemplate,
  pokeballTemplate,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): PaintTemplate | undefined {
  return paintTemplates.find(t => t.id === id);
}

/**
 * Create a fresh paint state from a template
 */
export function createPaintStateFromTemplate(templateId: string): PaintTemplate | null {
  const template = getTemplateById(templateId);
  if (!template) return null;

  return {
    ...template,
    regions: template.regions.map(region => ({
      ...region,
      filled: false,
      filledBy: undefined,
      filledAt: undefined,
    })),
  };
}
