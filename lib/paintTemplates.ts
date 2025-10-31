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
 * 6 regions for easy completion with small chat
 */
const heartTemplate: PaintTemplate = {
  id: 'heart',
  name: 'Heart',
  description: 'A simple heart - perfect for showing some love!',
  width: 32,
  height: 32,
  regions: createTemplateFromGrid(
    [
      '                                ',
      '    11111          22222        ',
      '   1111111        2222222       ',
      '  111111111      222222222      ',
      '  1111111111    22222222222     ',
      ' 11155555111    222222666222    ',
      ' 115555555111  2222666666622    ',
      ' 1555555555511 22266666666662   ',
      '115555533333511226666644444662  ',
      '155555333333331266664444444462  ',
      '155553333333333266644444444446  ',
      '155533333333333346444444444446  ',
      '155533333333333344444444444446  ',
      '155333333333333344444444444446  ',
      ' 15333333333333334444444444446  ',
      ' 15333333333333334444444444446  ',
      ' 15333333333333334444444444446  ',
      '  1533333333333334444444444446  ',
      '  1533333333333334444444444446  ',
      '   153333333333334444444444446  ',
      '   153333333333334444444444446  ',
      '    15333333333334444444444446  ',
      '    15333333333334444444444446  ',
      '     1533333333334444444444446  ',
      '      153333333334444444444446  ',
      '       15333333334444444444446  ',
      '        1533333334444444444446  ',
      '         153333334444444444446  ',
      '          15333334444444444446  ',
      '           1533334444444444446  ',
      '            153334444444444446  ',
      '             15334444444444446  ',
    ],
    {
      '1': '#C62828', // Dark red outline (left)
      '2': '#C62828', // Dark red outline (right)
      '3': '#F44336', // Bright red fill (left)
      '4': '#F44336', // Bright red fill (right)
      '5': '#FFCDD2', // Light pink highlight (left)
      '6': '#FFCDD2', // Light pink highlight (right)
    }
  ),
};

/**
 * Pokeball Template (32x32)
 * 6 regions for a classic pokeball design
 */
const pokeballTemplate: PaintTemplate = {
  id: 'pokeball',
  name: 'Pokeball',
  description: 'Gotta paint them all! A classic pokeball design.',
  width: 32,
  height: 32,
  regions: createTemplateFromGrid(
    [
      '                                ',
      '       111111111111111          ',
      '     11111111111111111111       ',
      '    1111111111111111111111      ',
      '   111111111111111111111111     ',
      '  11111111111111111111111111    ',
      '  11111111111111111111111111    ',
      ' 1111111111111111111111111111   ',
      ' 1111111111111111111111111111   ',
      '111111111111111111111111111111  ',
      '111111111111111111111111111111  ',
      '11122222222222222222233333331111',
      '11122222222222222222233333331111',
      '11122222222222266622233333331111',
      '11122222222222266622233333331111',
      '11122222222222266622233333331111',
      '11122222222222266622233333331111',
      '11144444444444466644455555551111',
      '11144444444444466644455555551111',
      '11144444444444466644455555551111',
      '11144444444444466644455555551111',
      '111111111111111111111111111111  ',
      '111111111111111111111111111111  ',
      ' 1111111111111111111111111111   ',
      ' 1111111111111111111111111111   ',
      '  11111111111111111111111111    ',
      '  11111111111111111111111111    ',
      '   111111111111111111111111     ',
      '    1111111111111111111111      ',
      '     11111111111111111111       ',
      '       111111111111111          ',
      '                                ',
    ],
    {
      '1': '#000000', // Black outline
      '2': '#EF5350', // Red top (left)
      '3': '#EF5350', // Red top (right)
      '4': '#FAFAFA', // White bottom (left)
      '5': '#FAFAFA', // White bottom (right)
      '6': '#FFFFFF', // Center button
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
