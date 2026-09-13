import { PaintTemplate } from '@/types/overlay';

/**
 * Built-in template modules are loaded on demand.
 *
 * The six built-in templates total ~6.2MB of source: they are lists of
 * per-pixel [x, y] coordinates, and falco alone is 3.6MB. Importing them
 * statically put ~3MB of minified coordinate arrays into the initial client
 * bundle (measured: a single 3.0MB chunk out of 5MB of .next/static), which
 * every dashboard visitor downloaded whether or not they opened the
 * Paint by Numbers panel. Loading them through dynamic import() moves them
 * into separate chunks fetched only when the panel is actually used.
 */
const builtInLoaders: Record<
  string,
  () => Promise<{ default: PaintTemplate }>
> = {
  heart: () => import('./paint-templates/heart'),
  pokeball: () => import('./paint-templates/pokeball'),
  mario: () => import('./paint-templates/mario'),
  'mario-and-luigi': () => import('./paint-templates/mario-and-luigi'),
  falco: () => import('./paint-templates/falco'),
  'mona-lisa': () => import('./paint-templates/mona-lisa'),
};

/** Ids of the built-in templates, in display order. */
export const builtInTemplateIds = Object.keys(builtInLoaders);

let cached: PaintTemplate[] | null = null;

/**
 * Load all built-in templates, caching the result so the chunks are only
 * fetched and parsed once per page load.
 */
export async function getBuiltInTemplates(): Promise<PaintTemplate[]> {
  if (cached) return cached;

  const modules = await Promise.all(
    builtInTemplateIds.map(id => builtInLoaders[id]())
  );
  cached = modules.map(m => m.default);
  return cached;
}

/**
 * Merge built-in templates with custom templates
 */
export async function mergeTemplates(
  customTemplates: PaintTemplate[]
): Promise<PaintTemplate[]> {
  const builtIns = await getBuiltInTemplates();
  return [...builtIns, ...customTemplates];
}

/**
 * Creates a fresh paint state from a template
 * All regions will be reset to unfilled state
 *
 * `allTemplates` is required: resolving it is the caller's job, so that this
 * module never has to hold a statically imported copy of the pixel data.
 */
export function createPaintStateFromTemplate(
  templateId: string,
  allTemplates: PaintTemplate[]
): PaintTemplate | null {
  const template = allTemplates.find(t => t.id === templateId);

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
