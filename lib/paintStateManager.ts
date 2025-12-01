// lib/paintStateManager.ts
import { PaintByNumbersState, PaintTemplate } from '@/types/overlay';
import {
  createPaintStateFromTemplate,
  mergeTemplates,
} from '@/lib/paintTemplates';
import { parseColor } from './colorUtils';

/**
 * Fetch custom templates for the current user
 */
async function fetchCustomTemplates(): Promise<PaintTemplate[]> {
  try {
    const response = await fetch('/api/paint-templates/list');
    if (!response.ok) return [];

    const data = await response.json();
    return data.templates || [];
  } catch (error) {
    console.error('Error fetching custom templates:', error);
    return [];
  }
}

/**
 * Get all templates (built-in + custom)
 */
async function getAllTemplates(): Promise<PaintTemplate[]> {
  const customTemplates = await fetchCustomTemplates();
  return mergeTemplates(customTemplates);
}

/**
 * Load the most recent paint template from saved states
 */
export async function loadMostRecentTemplate(
  sessionId: string
): Promise<PaintByNumbersState | null> {
  try {
    const response = await fetch(`/api/layouts/load?sessionId=${sessionId}`);
    if (!response.ok) return null;

    const { layout } = await response.json();
    if (!layout.paintByNumbersState) return null;

    const savedStates = JSON.parse(layout.paintByNumbersState);
    const templateIds = Object.keys(savedStates);

    if (templateIds.length === 0) return null;

    // Find the most recently worked on template
    let mostRecentTemplateId = templateIds[0];
    let mostRecentTime = savedStates[mostRecentTemplateId].startedAt || 0;

    for (const templateId of templateIds) {
      const state = savedStates[templateId];
      const lastTime = state.completedAt || state.startedAt || 0;
      if (lastTime > mostRecentTime) {
        mostRecentTime = lastTime;
        mostRecentTemplateId = templateId;
      }
    }

    // Reconstruct the template with saved state
    return reconstructTemplateState(
      mostRecentTemplateId,
      savedStates[mostRecentTemplateId]
    );
  } catch (error) {
    console.error('Error loading most recent template:', error);
    return null;
  }
}

/**
 * Load a specific template by ID, with saved state if available
 */
export async function loadTemplateState(
  templateId: string,
  sessionId: string
): Promise<PaintByNumbersState | null> {
  try {
    const response = await fetch(`/api/layouts/load?sessionId=${sessionId}`);
    if (!response.ok) return null;

    const { layout } = await response.json();
    if (layout.paintByNumbersState) {
      const savedStates = JSON.parse(layout.paintByNumbersState);
      const savedTemplateState = savedStates[templateId];

      if (savedTemplateState) {
        return reconstructTemplateState(templateId, savedTemplateState);
      }
    }

    // No saved state, create fresh template
    return createFreshTemplate(templateId);
  } catch (error) {
    console.error('Error loading template state:', error);
    return null;
  }
}

/**
 * Reconstruct a paint state from saved data
 */
async function reconstructTemplateState(
  templateId: string,
  savedState: {
    startedAt?: string;
    completedAt?: string | null;
    lastFilledBy?: string | null;
    filledRegions?: Record<
      string,
      {
        filledBy?: string;
        filledAt?: string;
        customColor?: string;
      }
    >;
  }
): Promise<PaintByNumbersState | null> {
  const allTemplates = await getAllTemplates();
  const template = createPaintStateFromTemplate(templateId, allTemplates);
  if (!template) return null;

  return {
    templateId,
    startedAt: savedState.startedAt ? Number(savedState.startedAt) : Date.now(),
    completedAt: savedState.completedAt
      ? Number(savedState.completedAt)
      : undefined,
    lastFilledBy: savedState.lastFilledBy || undefined,
    regions: template.regions.map(region => {
      const filledData = savedState.filledRegions?.[region.id];
      if (filledData) {
        return {
          ...region,
          filled: true,
          filledBy: filledData.filledBy,
          filledAt: filledData.filledAt
            ? Number(filledData.filledAt)
            : undefined,
          customColor: filledData.customColor,
        };
      }
      return region;
    }),
  };
}

/**
 * Create a fresh template state (no saved progress)
 */
export async function createFreshTemplate(
  templateId: string
): Promise<PaintByNumbersState | null> {
  const allTemplates = await getAllTemplates();
  const template = createPaintStateFromTemplate(templateId, allTemplates);
  if (!template) return null;

  return {
    templateId,
    regions: template.regions,
    startedAt: Date.now(),
  };
}

/**
 * Reset a template to its initial state
 */
export async function resetTemplate(
  currentState: PaintByNumbersState
): Promise<PaintByNumbersState | null> {
  const allTemplates = await getAllTemplates();
  const template = createPaintStateFromTemplate(
    currentState.templateId,
    allTemplates
  );
  if (!template) return null;

  return {
    templateId: currentState.templateId,
    regions: template.regions,
    startedAt: Date.now(),
  };
}

/**
 * Handle paint command from chat
 */
export function handlePaintCommand(
  paintState: PaintByNumbersState,
  regionId: number,
  username: string,
  timestamp: number,
  customColor?: string
): PaintByNumbersState | null {
  const region = paintState.regions.find(r => r.id === regionId);
  if (!region) return null; // Region doesn't exist

  // Check if region is already filled
  if (region.filled) {
    const COOLDOWN_MS = 60000; // 1 minute
    const timeSinceFilled = timestamp - (region.filledAt || 0);
    const isSameUser = region.filledBy === username;

    // Only allow repainting if it's the same user AND cooldown has passed
    if (!isSameUser || timeSinceFilled < COOLDOWN_MS) {
      return null; // Can't repaint yet
    }
  }

  // Parse and validate custom color if provided
  let validatedColor: string | undefined;
  if (customColor) {
    validatedColor = parseColor(customColor) || undefined;
  }

  // Update region as filled
  const updatedRegions = paintState.regions.map(r =>
    r.id === regionId
      ? {
          ...r,
          filled: true,
          filledBy: username,
          filledAt: timestamp,
          customColor: validatedColor,
        }
      : r
  );

  const allFilled = updatedRegions.every(r => r.filled);

  return {
    ...paintState,
    regions: updatedRegions,
    completedAt: allFilled ? timestamp : paintState.completedAt,
    lastFilledBy: username,
  };
}

/**
 * Handle paint-all command from chat
 */
export function handlePaintAllCommand(
  paintState: PaintByNumbersState,
  username: string,
  timestamp: number
): PaintByNumbersState {
  const updatedRegions = paintState.regions.map(r => ({
    ...r,
    filled: true,
    filledBy: username,
    filledAt: timestamp,
    customColor: undefined, // Use default template color
  }));

  return {
    ...paintState,
    regions: updatedRegions,
    completedAt: timestamp,
    lastFilledBy: username,
  };
}

/**
 * Generate a random hex color
 */
function generateRandomColor(): string {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Handle paint-random command from chat (development only)
 */
export function handlePaintRandomCommand(
  paintState: PaintByNumbersState,
  username: string,
  timestamp: number
): PaintByNumbersState {
  const updatedRegions = paintState.regions.map(r => ({
    ...r,
    filled: true,
    filledBy: username,
    filledAt: timestamp,
    customColor: generateRandomColor(),
  }));

  return {
    ...paintState,
    regions: updatedRegions,
    completedAt: timestamp,
    lastFilledBy: username,
  };
}

/**
 * Serialize paint state for database storage (compact format)
 */
export function serializePaintState(
  paintState: PaintByNumbersState,
  existingStates: Record<string, Partial<PaintByNumbersState>> = {}
): string {
  const filledRegions: Record<
    number,
    { filledBy: string; filledAt: number; customColor?: string }
  > = {};

  paintState.regions.forEach(region => {
    if (region.filled) {
      filledRegions[region.id] = {
        filledBy: region.filledBy!,
        filledAt: region.filledAt!,
        customColor: region.customColor,
      };
    }
  });

  // Update state for current template
  existingStates[paintState.templateId] = {
    startedAt: paintState.startedAt,
    completedAt: paintState.completedAt,
    lastFilledBy: paintState.lastFilledBy,
    filledRegions,
  };

  return JSON.stringify(existingStates);
}
