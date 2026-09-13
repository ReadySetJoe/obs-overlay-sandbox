import { test, expect } from '@playwright/test';
import {
  DASHBOARD_FEATURES,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  featuresByCategory,
  type FeatureCategory,
} from '@/lib/dashboardFeatures';

// The 11 layer ids defined in hooks/useLayers.ts. 'chat' is deliberately
// excluded from the registry: it is persisted but no overlay page renders
// anything gated on it, so surfacing a toggle for it would do nothing.
const REAL_LAYER_IDS = [
  'weather',
  'chat',
  'nowplaying',
  'countdown',
  'chathighlight',
  'paintbynumbers',
  'eventlabels',
  'streamstats',
  'wheel',
  'alerts',
  'tts',
];

test.describe('dashboard feature registry', () => {
  test('contains all 14 features', () => {
    expect(DASHBOARD_FEATURES).toHaveLength(14);
  });

  test('every id is unique', () => {
    const ids = DASHBOARD_FEATURES.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every layerId that is set is a real layer', () => {
    for (const feature of DASHBOARD_FEATURES) {
      if (feature.layerId !== null) {
        expect(
          REAL_LAYER_IDS,
          `${feature.id} points at layer "${feature.layerId}"`
        ).toContain(feature.layerId);
      }
    }
  });

  test('never surfaces the dead chat layer', () => {
    const ids = DASHBOARD_FEATURES.map(f => f.layerId);
    expect(ids).not.toContain('chat');
  });

  test('exactly four features have no visibility layer', () => {
    const withoutLayer = DASHBOARD_FEATURES.filter(f => f.layerId === null);
    expect(withoutLayer.map(f => f.id).sort()).toEqual([
      'background',
      'color',
      'emote',
      'textstyle',
    ]);
  });

  test('every feature belongs to a category in CATEGORY_ORDER', () => {
    for (const feature of DASHBOARD_FEATURES) {
      expect(CATEGORY_ORDER).toContain(feature.category);
    }
  });

  test('every category has a label and at least one feature', () => {
    for (const category of CATEGORY_ORDER) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
      expect(featuresByCategory(category).length).toBeGreaterThan(0);
    }
  });

  test('categories are evenly sized, 2 or 3 features each', () => {
    for (const category of CATEGORY_ORDER) {
      const size = featuresByCategory(category).length;
      expect(size, `category "${category}" has ${size}`).toBeGreaterThanOrEqual(
        2
      );
      expect(size).toBeLessThanOrEqual(3);
    }
  });

  test('appearance renders last, since it is not used mid-stream', () => {
    expect(CATEGORY_ORDER[CATEGORY_ORDER.length - 1]).toBe('appearance');
  });

  // Replaces an earlier "partition" test that summed per-category counts and
  // compared them to DASHBOARD_FEATURES.length. Both sides derived from the
  // same array, so removing a feature shrank both equally and the test could
  // not fail - verified by mutation. Hardcoding the expected distribution is
  // what gives this teeth.
  test('each category holds the expected number of features', () => {
    const sizes = Object.fromEntries(
      CATEGORY_ORDER.map((c: FeatureCategory) => [
        c,
        featuresByCategory(c).length,
      ])
    );

    expect(sizes).toEqual({
      'alerts-events': 2,
      chat: 2,
      'viewer-games': 2,
      readouts: 3,
      ambience: 2,
      appearance: 3,
    });
  });
});
