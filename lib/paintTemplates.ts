import { PaintTemplate, PaintRegion } from '@/types/overlay';
import heartTemplate from './paint-templates/heart';
import pokeballTemplate from './paint-templates/pokeball';
import marioTemplate from './paint-templates/mario';
import marioAndLuigiTemplate from './paint-templates/mario-and-luigi';

// Helper function to create pixel coordinates for a region
export function createRegion(id: number, color: string, pixels: [number, number][]): PaintRegion {
  return {
    id,
    color,
    pixels,
    filled: false,
  };
}

// Export all templates
export const paintTemplates: PaintTemplate[] = [
  heartTemplate,
  pokeballTemplate,
  marioTemplate,
  marioAndLuigiTemplate
];

/**
 * Creates a fresh paint state from a template
 * All regions will be reset to unfilled state
 */
export function createPaintStateFromTemplate(templateId: string): PaintTemplate | null {
  const template = paintTemplates.find(t => t.id === templateId);

  if (!template) {
    return null;
  }

  // Return a deep copy with all regions reset to unfilled
  return {
    ...template,
    regions: template.regions.map(region => ({
      ...region,
      filled: false,
      filledBy: undefined,
      filledAt: undefined,
      customColor: undefined,
    })),
  };
}
