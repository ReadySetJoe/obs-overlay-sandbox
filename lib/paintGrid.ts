// lib/paintGrid.ts

/** Smallest paint grid cell, in pixels. */
export const PAINT_GRID_SIZE_MIN = 1;

/**
 * Largest paint grid cell, in pixels.
 *
 * Lowered from 40 to 12. Layouts saved before the change persist larger values
 * in componentLayouts JSON, so every read goes through clampGridSize.
 */
export const PAINT_GRID_SIZE_MAX = 12;

/** Default for new sessions - the maximum, i.e. as close to the old feel as the cap allows. */
export const DEFAULT_PAINT_GRID_SIZE = 12;

/**
 * Force a persisted or user-supplied grid size into the supported range.
 * Unusable input falls back to the default rather than throwing, because this
 * runs on JSON loaded from the database.
 */
export function clampGridSize(value: number | null | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return DEFAULT_PAINT_GRID_SIZE;
  }
  return Math.min(
    PAINT_GRID_SIZE_MAX,
    Math.max(PAINT_GRID_SIZE_MIN, Math.round(value))
  );
}
