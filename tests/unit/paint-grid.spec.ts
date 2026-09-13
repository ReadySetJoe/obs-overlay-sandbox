import { test, expect } from '@playwright/test';
import {
  PAINT_GRID_SIZE_MIN,
  PAINT_GRID_SIZE_MAX,
  DEFAULT_PAINT_GRID_SIZE,
  clampGridSize,
} from '@/lib/paintGrid';

test.describe('clampGridSize', () => {
  test('exposes the agreed bounds', () => {
    expect(PAINT_GRID_SIZE_MIN).toBe(1);
    expect(PAINT_GRID_SIZE_MAX).toBe(12);
    expect(DEFAULT_PAINT_GRID_SIZE).toBe(12);
  });

  test('passes through in-range values', () => {
    expect(clampGridSize(1)).toBe(1);
    expect(clampGridSize(7)).toBe(7);
    expect(clampGridSize(12)).toBe(12);
  });

  test('clamps values persisted before the cap', () => {
    expect(clampGridSize(20)).toBe(12);
    expect(clampGridSize(40)).toBe(12);
  });

  test('clamps below the minimum', () => {
    expect(clampGridSize(0)).toBe(1);
    expect(clampGridSize(-5)).toBe(1);
  });

  test('falls back to the default for unusable input', () => {
    expect(clampGridSize(undefined)).toBe(DEFAULT_PAINT_GRID_SIZE);
    expect(clampGridSize(null)).toBe(DEFAULT_PAINT_GRID_SIZE);
    expect(clampGridSize(Number.NaN)).toBe(DEFAULT_PAINT_GRID_SIZE);
  });

  test('rounds fractional values', () => {
    expect(clampGridSize(7.6)).toBe(8);
  });
});
