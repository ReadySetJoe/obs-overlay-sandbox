import { test, expect } from '@playwright/test';
import {
  DASHBOARD_FEATURES,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  featuresByCategory,
  type FeatureCategory,
} from '@/lib/dashboardFeatures';

// Layer ids an overlay page actually gates rendering on, i.e. the result of
// grep -o "getLayerVisible('[a-z]*')" over pages/overlay/.
//
// This deliberately is NOT the eleven ids hooks/useLayers.ts defines. Two of
// those - 'chat' and 'alerts' - are persisted but ungated, so a visibility
// toggle for them does nothing while still writing state. An earlier version
// of this list used the defined ids and therefore accepted a broken
// layerId: 'alerts' without complaint.
const GATED_LAYER_IDS = [
  'chathighlight',
  'countdown',
  'eventlabels',
  'nowplaying',
  'paintbynumbers',
  'streamstats',
  'tts',
  'weather',
  'wheel',
];

test.describe('dashboard feature registry', () => {
  test('contains all 14 features', () => {
    expect(DASHBOARD_FEATURES).toHaveLength(14);
  });

  test('every id is unique', () => {
    const ids = DASHBOARD_FEATURES.map(f => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every layerId that is set is gated by an overlay page', () => {
    for (const feature of DASHBOARD_FEATURES) {
      if (feature.layerId !== null) {
        expect(
          GATED_LAYER_IDS,
          `${feature.id} offers a toggle for layer "${feature.layerId}", which no overlay page gates on`
        ).toContain(feature.layerId);
      }
    }
  });

  test('never surfaces an ungated layer', () => {
    const ids = DASHBOARD_FEATURES.map(f => f.layerId);
    expect(ids).not.toContain('chat');
    expect(ids).not.toContain('alerts');
  });

  test('exactly five features have no visibility layer', () => {
    const withoutLayer = DASHBOARD_FEATURES.filter(f => f.layerId === null);
    expect(withoutLayer.map(f => f.id).sort()).toEqual([
      'alerts',
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
