# Dashboard Feature Registry & Category Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dashboard's six uneven `CollapsibleSection`s and fourteen full-width `SummaryTile` rows with a declarative feature registry driving a compact category grid, fixing both the vertical sprawl and the arbitrary groupings.

**Architecture:** A single typed registry (`lib/dashboardFeatures.ts`) becomes the source of truth for every dashboard feature — its id, label, category and visibility layer. A compact `FeatureTile` and a `CategoryCard` render from that list, replacing ~250 lines of repetitive JSX in a 906-line page. Icons live in a separate map so the registry stays pure and unit-testable without React.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript, Tailwind CSS 4, Playwright.

**Related spec:** `docs/superpowers/specs/2026-09-13-dashboard-and-overlay-improvements-design.md` section 1.

**Scope:** This is **Plan 2a**, covering the registry and the grid — the taxonomy and density half of spec item 1.

Deferred to **Plan 2b**: the "On stream now" bar, the inline visibility prompt (spec item 4), and relocating the chat feed to a persistent panel. All three appear in the spec’s page structure, so splitting them out is a deliberate scope decision, not an omission — the spec’s own note says to split if this stage exceeds a single reviewable change, and it does. 2a ships a working, better dashboard on its own.

---

## Pre-flight

```bash
docker compose up -d
export DATABASE_URL="postgresql://obs_user:obs_password@localhost:5432/obs_overlay"
npx prisma migrate deploy
```

Do not start a dev server — `playwright.config.ts` starts its own, and a stray `npm run dev` holds Prisma's query engine DLL open on Windows, breaking `npm run build` with `EPERM`.

**Baseline to preserve: 56 passed, 4 skipped, 0 failed.**

**Clear `.next` before any test run you intend to trust** (`rm -rf .next`). `playwright.config.ts:64` sets `reuseExistingServer: !process.env.CI`, so a surviving dev server serves already-compiled output. This produced a genuine false pass during Plan 1.

---

## The constraint that shapes this plan

**Seven existing e2e selectors click tiles by their displayed title.** Across `tests/e2e/realtime/`:

```
text=Color Scheme        text=Recent Events
text=Countdown Timers    text=Stream Stats
text=Paint by Numbers    text=Weather Effects
text=Wheel Spinner
```

Any change to tile copy breaks all of them. So Task 1 decouples the specs from display text *before* anything visual changes — the same "make the later change a one-liner" move that made Plan 1's Task 1 load-bearing. Do not reorder Task 1.

(The other `text=` selectors in those specs — `Select Template`, `Display Mode`, `Goal Targets`, `Position & Size`, `Create Wheel`, `Days`/`Hours`/`Mins`/`Secs`, etc. — are inside expanded panels, which this plan does not touch. Leave them alone.)

---

## Prior findings this plan depends on

**The `chat` layer is plumbed but renders nothing.** `hooks/useLayers.ts:18` defines it, `hooks/useLayoutPersistence.ts:116` loads it from `layout.chatVisible`, `pages/api/layouts/save.ts:140` persists it, and `hooks/useOverlaySocket.ts:69,230` carries it with `zIndex: 5` — but **no overlay page gates anything on `getLayerVisible('chat')`**. It is live in the persistence path and dead in the render path.

So there are 11 layers, of which 10 control something. The registry must **not** surface `chat`, because a toggle that does nothing is worse than no toggle. Leave its plumbing alone — removing `chatVisible` would be a schema change and is out of scope.

That reconciles the counts: **14 features = 10 with a visibility layer + 4 without** (`color`, `background`, `textstyle` are global; `emote` is fire-only).

**The 14 registry ids already exist.** They are the strings passed to `useExpandedView`'s `handleExpandElement`, so reusing them means the expanded-panel dispatch at `pages/dashboard/[sessionId].tsx:426+` needs no changes at all:

```
color  background  textstyle  weather  emote  streamstats  eventlabels
wheel  paint  countdown  chathighlight  tts  alerts  nowplaying
```

---

## File Structure

| File | Responsibility |
|---|---|
| Create: `lib/dashboardFeatures.ts` | The registry: id, label, category, layer id, colour for all 14 features, plus the category definitions and order. Pure data and pure helpers — **no JSX**, so it unit-tests without React. |
| Create: `tests/unit/dashboard-features.spec.ts` | Unit tests for registry integrity (see Task 2 — these are the tests that would catch a feature silently vanishing). |
| Create: `components/dashboard/tiles/featureIcons.tsx` | Maps feature id → icon component. Separate from the registry so `lib/` never imports from `components/`. |
| Create: `components/dashboard/tiles/FeatureTile.tsx` | One compact tile: icon, label, visibility dot, click-to-expand. Replaces the full-width `SummaryTile` row in the grid. |
| Create: `components/dashboard/CategoryCard.tsx` | One category: heading, count, and a wrapping grid of its `FeatureTile`s. |
| Modify: `components/dashboard/tiles/SummaryTile.tsx` | Add `data-testid` (Task 1 only). Otherwise untouched — it stays in use by the expanded panels' own headers. |
| Modify: `tests/e2e/realtime/*.spec.ts` (5 files) | Task 1: migrate the seven tile-title selectors to `getByTestId`. |
| Modify: `pages/dashboard/[sessionId].tsx` | Replace the six `CollapsibleSection` blocks and fourteen `SummaryTile`s with a registry-driven grid. The expanded-panel dispatch below it is untouched. |

`components/dashboard/CollapsibleSection.tsx` becomes unused by the dashboard grid but is **not deleted** — Task 5 Step 5 checks for other consumers first.

---

## Task 1: Decouple the e2e specs from tile display text

**Files:**
- Modify: `components/dashboard/tiles/SummaryTile.tsx`
- Modify: `pages/dashboard/[sessionId].tsx` (add `testId` to the 14 `SummaryTile` usages)
- Modify: `tests/e2e/realtime/color-scheme-sync.spec.ts`, `countdown-timer.spec.ts`, `event-labels.spec.ts`, `paint-by-numbers.spec.ts`, `stream-stats.spec.ts`, `weather-effects.spec.ts`, `wheel-spinner.spec.ts`

No visual change. The suite must stay at exactly 56 passed, 4 skipped.

- [ ] **Step 1: Add an optional `testId` prop to `SummaryTile`**

In `components/dashboard/tiles/SummaryTile.tsx`, add to the props interface:

```tsx
interface SummaryTileProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: ThemeColor;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
  onClick: () => void;
  /** Stable hook for tests, so specs do not couple to display copy. */
  testId?: string;
}
```

Destructure `testId` alongside the others, and put it on the outermost `div` of the returned JSX:

```tsx
    <div
      data-testid={testId}
      ...existing className and props unchanged...
    >
```

- [ ] **Step 2: Pass `testId` on all 14 tiles**

In `pages/dashboard/[sessionId].tsx`, add a `testId` to each `SummaryTile`, using the same string already passed to `handleExpandElement`. For example the Color Scheme tile becomes:

```tsx
                <SummaryTile
                  testId='tile-color'
                  title='Color Scheme'
                  subtitle={colorSchemeHook.colorScheme}
                  icon={<ColorSchemeIcon />}
                  color='purple'
                  onClick={() => expandedViewHook.handleExpandElement('color')}
                />
```

The full set of `testId` values, matching the expand ids with a `tile-` prefix:

```
tile-color  tile-background  tile-textstyle  tile-weather  tile-emote
tile-streamstats  tile-eventlabels  tile-wheel  tile-paint  tile-countdown
tile-chathighlight  tile-tts  tile-alerts  tile-nowplaying
```

- [ ] **Step 3: Verify all 14 test ids are present**

```bash
grep -c "testId='tile-" "pages/dashboard/[sessionId].tsx"
```

Expected: `14`.

- [ ] **Step 4: Migrate the seven tile-title selectors**

Replace each of these, and **only** these — leave in-panel selectors alone:

| File | Old | New |
|---|---|---|
| `color-scheme-sync.spec.ts` (2 sites) | `page.click('text=Color Scheme')` | `page.getByTestId('tile-color').click()` |
| `countdown-timer.spec.ts` (4 sites) | `page.click('text=Countdown Timers')` | `page.getByTestId('tile-countdown').click()` |
| `event-labels.spec.ts` (4 sites) | `page.click('text=Recent Events')` | `page.getByTestId('tile-eventlabels').click()` |
| `paint-by-numbers.spec.ts` | `page.click('text=Paint by Numbers')` | `page.getByTestId('tile-paint').click()` |
| `stream-stats.spec.ts` | `page.click('text=Stream Stats')` | `page.getByTestId('tile-streamstats').click()` |
| `weather-effects.spec.ts` | `page.click('text=Weather Effects')` | `page.getByTestId('tile-weather').click()` |
| `wheel-spinner.spec.ts` | `page.click('text=Wheel Spinner')` | `page.getByTestId('tile-wheel').click()` |

Find every occurrence first so none is missed:

```bash
grep -rn "text=Color Scheme\|text=Countdown Timers\|text=Recent Events\|text=Paint by Numbers\|text=Stream Stats\|text=Weather Effects\|text=Wheel Spinner" tests/e2e/
```

Migrate each hit, then re-run that grep — it must return nothing.

**Careful with `text=Stream Stats`:** the tile's title is "Stream Stats & Goals", so the old selector was a substring match. Check whether the expanded panel also contains "Stream Stats" text; if the spec relies on that *after* opening the panel, leave that later assertion as-is and change only the tile click.

- [ ] **Step 5: Run type-check, lint and the full suite**

```bash
rm -rf .next
npm run type-check
npm run lint
npx playwright test --reporter=line
```

Expected: type-check 0; lint 0 errors; **56 passed, 4 skipped** — unchanged. This task alters no behaviour, so any deviation means a selector migration was wrong.

- [ ] **Step 6: Prove the new selectors actually bind**

A `getByTestId` that matches nothing fails loudly, so a green suite is already good evidence. But confirm the ids are reachable rather than assuming:

```bash
grep -rn "getByTestId('tile-" tests/e2e/ | wc -l
```

Expected: `14` (2 + 4 + 4 + 1 + 1 + 1 + 1).

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/tiles/SummaryTile.tsx "pages/dashboard/[sessionId].tsx" tests/e2e/realtime/
git commit -m "test(dashboard): locate tiles by test id, not display text

Seven e2e selectors clicked dashboard tiles by their titles, so any
change to tile copy broke five spec files. Adds a testId prop to
SummaryTile, wires it on all 14 tiles using the existing expand ids, and
migrates the selectors. No behaviour change - the suite is unchanged at
56 passed, 4 skipped.

This is a prerequisite for the compact category grid, which changes
tile labels."
```

---

## Task 2: The feature registry

**Files:**
- Create: `lib/dashboardFeatures.ts`
- Create: `tests/unit/dashboard-features.spec.ts`

- [ ] **Step 1: Write the failing unit test**

These tests are chosen to catch the failure modes that actually matter for a registry: a feature silently disappearing, a duplicate id, a bogus layer id, or a category drifting out of the declared order. They are not decoration — a hand-maintained list of 14 items is exactly the kind of thing that rots.

```ts
// tests/unit/dashboard-features.spec.ts
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

  test('featuresByCategory partitions the registry with no loss', () => {
    const total = CATEGORY_ORDER.reduce(
      (sum, c: FeatureCategory) => sum + featuresByCategory(c).length,
      0
    );
    expect(total).toBe(DASHBOARD_FEATURES.length);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test tests/unit/dashboard-features.spec.ts --reporter=list
```

Expected: FAIL — cannot resolve `@/lib/dashboardFeatures`.

- [ ] **Step 3: Create the registry**

```ts
// lib/dashboardFeatures.ts
import type { ThemeColor } from '@/lib/theme';

/**
 * Dashboard feature categories, in render order.
 *
 * Chosen to be even (2-3 features each) and honest about what things are. The
 * previous grouping was 3-2-2-3-3-1 and arbitrary: "Integrations" held exactly
 * one feature, Countdown Timers sat under "Interactive Features" despite being
 * purely informational, and Stream Alerts was filed under "Chat".
 *
 * `appearance` is last on purpose - theme, background and font are configured
 * before streaming and never touched live.
 */
export const CATEGORY_ORDER = [
  'alerts-events',
  'chat',
  'viewer-games',
  'readouts',
  'ambience',
  'appearance',
] as const;

export type FeatureCategory = (typeof CATEGORY_ORDER)[number];

export const CATEGORY_LABELS: Record<FeatureCategory, string> = {
  'alerts-events': 'Alerts & Events',
  chat: 'Chat',
  'viewer-games': 'Viewer Games',
  readouts: 'Readouts',
  ambience: 'Ambience',
  appearance: 'Appearance',
};

export interface DashboardFeature {
  /**
   * Stable key. Deliberately identical to the string passed to
   * useExpandedView's handleExpandElement, so the expanded-panel dispatch in
   * pages/dashboard/[sessionId].tsx needs no changes.
   */
  id: string;
  /** Label shown on the tile. */
  name: string;
  category: FeatureCategory;
  /**
   * Layer id for the visibility toggle, or null when the feature has none.
   *
   * Four features have none: colour scheme, background and text style are
   * global appearance settings rather than overlay layers, and the emote wall
   * is fire-only - it has no persistent visible state to toggle.
   *
   * Note 'chat' is never used here. hooks/useLayers.ts defines it and it is
   * persisted as layout.chatVisible, but no overlay page renders anything
   * gated on it, so a toggle would do nothing.
   */
  layerId: string | null;
  color: ThemeColor;
}

export const DASHBOARD_FEATURES: DashboardFeature[] = [
  // Alerts & Events
  { id: 'alerts', name: 'Alerts', category: 'alerts-events', layerId: 'alerts', color: 'red' },
  { id: 'eventlabels', name: 'Recent Events', category: 'alerts-events', layerId: 'eventlabels', color: 'yellow' },

  // Chat
  { id: 'chathighlight', name: 'Chat Highlight', category: 'chat', layerId: 'chathighlight', color: 'cyan' },
  { id: 'tts', name: 'Text to Speech', category: 'chat', layerId: 'tts', color: 'blue' },

  // Viewer Games
  { id: 'wheel', name: 'Wheel Spinner', category: 'viewer-games', layerId: 'wheel', color: 'pink' },
  { id: 'paint', name: 'Paint by Numbers', category: 'viewer-games', layerId: 'paintbynumbers', color: 'purple' },

  // Readouts
  { id: 'streamstats', name: 'Stream Stats', category: 'readouts', layerId: 'streamstats', color: 'green' },
  { id: 'countdown', name: 'Countdown Timers', category: 'readouts', layerId: 'countdown', color: 'orange' },
  { id: 'nowplaying', name: 'Now Playing', category: 'readouts', layerId: 'nowplaying', color: 'green' },

  // Ambience
  { id: 'weather', name: 'Weather Effects', category: 'ambience', layerId: 'weather', color: 'cyan' },
  { id: 'emote', name: 'Emote Wall', category: 'ambience', layerId: null, color: 'yellow' },

  // Appearance
  { id: 'color', name: 'Color Scheme', category: 'appearance', layerId: null, color: 'purple' },
  { id: 'background', name: 'Custom Background', category: 'appearance', layerId: null, color: 'pink' },
  { id: 'textstyle', name: 'Text Style', category: 'appearance', layerId: null, color: 'orange' },
];

/** Features in a category, in registry order. */
export function featuresByCategory(
  category: FeatureCategory
): DashboardFeature[] {
  return DASHBOARD_FEATURES.filter(f => f.category === category);
}
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx playwright test tests/unit/dashboard-features.spec.ts --reporter=list
```

Expected: 10 tests PASS.

- [ ] **Step 5: Prove the integrity tests have teeth**

Per the mutation protocol below, and because a registry test that cannot fail is worthless:

1. Kill any dev server and `rm -rf .next`.
2. Delete the `nowplaying` entry from `DASHBOARD_FEATURES`.
3. Re-run. **Three** tests must fail: the length check, the partition check, and the even-sizing check (readouts drops to 2, which is still legal — so confirm which actually fail and report it).
4. Restore, `rm -rf .next`, re-run green.

Read the actual failure messages. If only the length test fails, say so — that is still fine, but report it accurately rather than claiming broader coverage.

- [ ] **Step 6: Commit**

```bash
git add lib/dashboardFeatures.ts tests/unit/dashboard-features.spec.ts
git commit -m "feat(dashboard): add a declarative feature registry

Single source of truth for all 14 dashboard features - id, label,
category, visibility layer, colour. The ids match the existing
handleExpandElement strings so the expanded-panel dispatch needs no
changes.

Deliberately excludes the 'chat' layer: useLayers defines it and it is
persisted as layout.chatVisible, but no overlay page renders anything
gated on it, so surfacing a toggle would do nothing.

Pure data with no JSX, so it unit-tests without React. Integrity tests
cover the failure modes a hand-maintained list of 14 actually has: a
feature vanishing, a duplicate id, a layerId pointing at a
non-existent layer, and category sizes drifting."
```

---

## Task 3: Feature icons map

**Files:**
- Create: `components/dashboard/tiles/featureIcons.tsx`

Kept separate from the registry so `lib/` never imports from `components/` — that dependency direction would be backwards, and it is what lets Task 2's registry be tested without React.

- [ ] **Step 1: Create the map**

```tsx
// components/dashboard/tiles/featureIcons.tsx
import type { ComponentType } from 'react';
import {
  AlertsIcon,
  BackgroundIcon,
  ChatHighlightIcon,
  ColorSchemeIcon,
  CountdownIcon,
  EmoteWallIcon,
  EventLabelsIcon,
  NowPlayingIcon,
  PaintByNumbersIcon,
  StreamStatsIcon,
  TTSIcon,
  TextStyleIcon,
  WeatherIcon,
  WheelIcon,
} from './TileIcons';

/**
 * Feature id -> icon. Keys must match lib/dashboardFeatures.ts ids; Task 4's
 * FeatureTile falls back to null rather than crashing if one is missing, and
 * Task 5 Step 4 asserts every registry id has an entry here.
 */
export const FEATURE_ICONS: Record<string, ComponentType> = {
  alerts: AlertsIcon,
  eventlabels: EventLabelsIcon,
  chathighlight: ChatHighlightIcon,
  tts: TTSIcon,
  wheel: WheelIcon,
  paint: PaintByNumbersIcon,
  streamstats: StreamStatsIcon,
  countdown: CountdownIcon,
  nowplaying: NowPlayingIcon,
  weather: WeatherIcon,
  emote: EmoteWallIcon,
  color: ColorSchemeIcon,
  background: BackgroundIcon,
  textstyle: TextStyleIcon,
};
```

- [ ] **Step 2: Verify it type-checks**

```bash
npm run type-check
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/tiles/featureIcons.tsx
git commit -m "feat(dashboard): map feature ids to tile icons

Separate from lib/dashboardFeatures.ts so the registry stays free of
JSX and unit-testable without React."
```

---

## Task 4: The compact `FeatureTile`

**Files:**
- Create: `components/dashboard/tiles/FeatureTile.tsx`

- [ ] **Step 1: Create the component**

```tsx
// components/dashboard/tiles/FeatureTile.tsx
'use client';

import { colorClasses } from '@/lib/theme';
import type { DashboardFeature } from '@/lib/dashboardFeatures';
import { FEATURE_ICONS } from './featureIcons';

interface FeatureTileProps {
  feature: DashboardFeature;
  /** Undefined for features with no visibility layer. */
  isVisible?: boolean;
  /** Absent for features with no visibility layer. */
  onToggleVisibility?: () => void;
  onClick: () => void;
}

/**
 * One compact dashboard tile.
 *
 * Replaces the full-width SummaryTile row in the grid. The visibility dot is
 * the primary state cue and is a real button, so it can be hit without opening
 * the detail panel - the dashboard is used live, mid-stream.
 */
export default function FeatureTile({
  feature,
  isVisible,
  onToggleVisibility,
  onClick,
}: FeatureTileProps) {
  const Icon = FEATURE_ICONS[feature.id] ?? null;
  const hoverBorder =
    colorClasses[feature.color]?.hoverBorder || 'hover:border-gray-500/50';

  return (
    <div
      data-testid={`tile-${feature.id}`}
      className={`relative rounded-lg border border-gray-700 bg-gray-800/60 p-3 transition-colors ${hoverBorder} ${
        isVisible ? 'border-green-500/60 bg-green-900/20' : ''
      }`}
    >
      <button
        type='button'
        onClick={onClick}
        className='flex w-full flex-col items-center gap-1 text-center'
      >
        <span className='text-xl'>{Icon ? <Icon /> : null}</span>
        <span className='text-[11px] leading-tight text-gray-200'>
          {feature.name}
        </span>
      </button>

      {onToggleVisibility && (
        <button
          type='button'
          data-testid={`toggle-${feature.id}`}
          aria-label={`${isVisible ? 'Hide' : 'Show'} ${feature.name}`}
          onClick={onToggleVisibility}
          className='absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full transition-colors'
          style={{ backgroundColor: isVisible ? '#34d399' : '#4b5563' }}
        />
      )}
    </div>
  );
}
```

Note the `data-testid={`tile-${feature.id}`}` matches the ids Task 1 introduced, so the seven migrated e2e selectors keep working across the grid swap. That is the whole reason Task 1 comes first.

- [ ] **Step 2: Verify it type-checks**

```bash
npm run type-check
```

Expected: exits 0. Nothing renders it yet.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/tiles/FeatureTile.tsx
git commit -m "feat(dashboard): add the compact FeatureTile

Icon, label and a visibility dot in a small card, replacing the
full-width icon+title+subtitle+switch row. The dot is a separate button
so visibility can be flipped without opening the detail panel, which is
what the live mid-stream workflow needs.

Carries the same tile-<id> test id the specs were migrated to, so the
grid swap does not break them."
```

---

## Task 5: `CategoryCard` and the grid swap

**Files:**
- Create: `components/dashboard/CategoryCard.tsx`
- Modify: `pages/dashboard/[sessionId].tsx`

- [ ] **Step 1: Create `CategoryCard`**

```tsx
// components/dashboard/CategoryCard.tsx
'use client';

import type { FeatureCategory } from '@/lib/dashboardFeatures';
import { CATEGORY_LABELS, featuresByCategory } from '@/lib/dashboardFeatures';
import FeatureTile from './tiles/FeatureTile';

interface CategoryCardProps {
  category: FeatureCategory;
  /** Layer id -> visible. Features with a null layerId are not looked up. */
  visibility: Record<string, boolean>;
  onToggleLayer: (layerId: string) => void;
  onExpand: (featureId: string) => void;
  /** Appearance is de-emphasised: it is configured before streaming. */
  dimmed?: boolean;
}

export default function CategoryCard({
  category,
  visibility,
  onToggleLayer,
  onExpand,
  dimmed = false,
}: CategoryCardProps) {
  const features = featuresByCategory(category);

  return (
    <div
      data-testid={`category-${category}`}
      className={`rounded-lg border border-gray-700 p-3 ${dimmed ? 'opacity-75' : ''}`}
    >
      <div className='mb-2 flex items-center gap-2'>
        <h3 className='text-xs font-bold uppercase tracking-wide text-gray-300'>
          {CATEGORY_LABELS[category]}
        </h3>
        <span className='text-xs text-gray-500'>{features.length}</span>
      </div>

      <div className='grid grid-cols-3 gap-2'>
        {features.map(feature => (
          <FeatureTile
            key={feature.id}
            feature={feature}
            isVisible={
              feature.layerId ? visibility[feature.layerId] : undefined
            }
            onToggleVisibility={
              feature.layerId
                ? () => onToggleLayer(feature.layerId as string)
                : undefined
            }
            onClick={() => onExpand(feature.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Replace the grid in the dashboard page**

In `pages/dashboard/[sessionId].tsx`, add these imports alongside the existing ones:

```tsx
import CategoryCard from '@/components/dashboard/CategoryCard';
import { CATEGORY_ORDER } from '@/lib/dashboardFeatures';
```

Find the exact boundaries first rather than eyeballing them:

```bash
grep -n "key='summary-grid'" "pages/dashboard/[sessionId].tsx"
grep -n "expandedViewHook.expandedElement ?" "pages/dashboard/[sessionId].tsx"
grep -n "</CollapsibleSection>" "pages/dashboard/[sessionId].tsx" | tail -1
```

The block to replace runs from the `summary-grid` wrapper div through the **last** `</CollapsibleSection>` plus that wrapper’s own closing `</div>`. The line after it should be the `) : (` of the ternary whose other branch renders the expanded panel. Confirm that before deleting — if the line after your chosen end is not that `) : (`, your boundary is wrong.

Replace it with:

```tsx
            <div key='summary-grid' className='animate-zoom-in'>
              <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'>
                {CATEGORY_ORDER.map(category => (
                  <CategoryCard
                    key={category}
                    category={category}
                    visibility={layerVisibility}
                    onToggleLayer={layersHook.toggleLayer}
                    onExpand={expandedViewHook.handleExpandElement}
                    dimmed={category === 'appearance'}
                  />
                ))}
              </div>
            </div>
```

Do **not** touch anything below it — the expanded-panel dispatch starting at the `expandedViewHook.expandedElement === 'color'` branch stays exactly as it is, which is why the registry reuses those ids.

- [ ] **Step 3: Add the `layerVisibility` lookup**

The page already derives per-layer visibility ad hoc via a `getIsVisible` helper. `CategoryCard` wants a plain map. Add this next to the existing hook calls, after `layersHook` is created:

```tsx
  const layerVisibility = Object.fromEntries(
    layersHook.layers.map(layer => [layer.id, layer.visible])
  );
```

Leave `getIsVisible` in place if anything below still uses it; check with:

```bash
grep -n "getIsVisible" "pages/dashboard/[sessionId].tsx"
```

If the only remaining references were inside the block you deleted, remove the now-unused helper too — lint will flag it otherwise.

- [ ] **Step 4: Verify every registry id has an icon and a panel**

```bash
grep -cE "^  [a-z]+: [A-Z]" components/dashboard/tiles/featureIcons.tsx
grep -cE "^  { id: '" lib/dashboardFeatures.ts
```

Expected: both `14`. A registry id with no icon renders a blank tile rather than crashing, so this check is what catches it.

Then confirm every id still has an expanded panel branch:

```bash
for id in color background textstyle weather emote streamstats eventlabels wheel paint countdown chathighlight tts alerts nowplaying; do
  grep -q "expandedElement === '$id'" "pages/dashboard/[sessionId].tsx" || echo "MISSING PANEL: $id"
done
echo "panel check done"
```

Expected: only `panel check done`. Any `MISSING PANEL` line means a tile would open nothing.

- [ ] **Step 5: Check whether `CollapsibleSection` still has consumers**

```bash
grep -rn "CollapsibleSection" --include=*.tsx pages components | grep -v "components/dashboard/CollapsibleSection.tsx"
```

If that returns nothing, the component is now unused. **Do not delete it in this task** — report it, and leave removal to a follow-up. Deleting it here would mix a cleanup into the change under test.

- [ ] **Step 6: Full verification**

```bash
rm -rf .next
npm run type-check
npm run lint
npx playwright test --reporter=line
```

Expected: type-check 0; lint 0 errors; **66 passed, 4 skipped** (56 plus Task 2's 10 unit tests).

The five migrated spec files are the real regression net here: they click `tile-color`, `tile-countdown`, `tile-eventlabels`, `tile-paint`, `tile-streamstats`, `tile-weather` and `tile-wheel`, then assert on the panels that open. If the grid swap broke the wiring, they fail.

- [ ] **Step 7: Commit**

```bash
git add components/dashboard/CategoryCard.tsx "pages/dashboard/[sessionId].tsx"
git commit -m "feat(dashboard): replace collapsible sections with a category grid

Six CollapsibleSections holding fourteen full-width tile rows become a
responsive grid of six even category cards, rendered from
lib/dashboardFeatures.ts. Fixes both complaints: the vertical sprawl
(fourteen stacked rows in one column) and the arbitrary groupings
(3-2-2-3-3-1, with 'Integrations' holding one feature and Stream Alerts
filed under Chat).

Appearance renders last and dimmed - it is configured before streaming,
never mid-stream.

The expanded-panel dispatch is untouched: the registry reuses the
existing handleExpandElement ids."
```

---

## Final verification

- [ ] **Run every gate CI runs**

```bash
rm -rf .next
npm run type-check
npm run lint
npm run build
npm audit --audit-level=critical
npx playwright test --reporter=line
```

Expected: all exit 0. Suite **66 passed, 4 skipped**.

| After | Tests added | Expected |
|---|---|---|
| baseline | — | 56 passed, 4 skipped |
| Task 1 | +0 (migration only) | 56, 4 |
| Task 2 | +10 (unit) | 66, 4 |
| Tasks 3-5 | +0 | 66, 4 |

- [ ] **Confirm the sprawl is actually gone**

This plan's whole purpose is a visual change that no automated test asserts. Before declaring it done, load the dashboard and check by eye that all six category cards and fourteen tiles are visible without scrolling at a typical window size. If they are not, the grid needs tightening and the plan has not delivered its goal — say so rather than reporting green tests as success.

- [ ] **Do not push without asking.** Pushing to `main` triggers a production deploy on Railway.

---

## Mutation-testing protocol

A test that passes for the wrong reason is worse than no test. Plan 1 produced three, so follow this whenever confirming a test has teeth.

1. **Kill any dev server and `rm -rf .next` before both the baseline and the mutated run.** `playwright.config.ts:64` sets `reuseExistingServer: !process.env.CI`, so a surviving server serves already-compiled output and the mutated run can be answered from stale bundles.
2. **Mutate the requirement the test claims to prove, not merely nearby code.** Plan 1's worked example: a test named for a size-keyed storage guard was "verified" by disabling an adjacent resize listener, while deleting the actual size-keying left every test green.
3. **Require the mutated run to fail for the stated reason.** Read the message.
4. **Restore, clear `.next`, re-run green before committing.**

---

## Notes for the implementer

- **Windows file locks.** A running dev server holds `node_modules/.prisma/client/query_engine-windows.dll.node` open, so `npm run build` fails with `EPERM`. Stop any dev server before building; Playwright manages its own.
- **`.env` vs `.env.local`.** The Prisma CLI reads `.env`; Next reads `.env.local`. Pass `DATABASE_URL` explicitly for `prisma` commands.
- **Do not touch the expanded panels.** `AlertsExpanded.tsx` (857 lines) and `TextToSpeechExpanded.tsx` (713 lines) are genuinely overwhelming, and the spec says so — but reorganising navigation does not address that, and it is explicitly out of scope for this plan and Plan 2b.
- **Do not remove the `chat` layer.** It is dead in the render path but live in the persistence path, and `layout.chatVisible` is a real database column. Removing it is a schema change.
- **Subagents: do not stop waiting for a background notification.** You will not receive one. Read output files directly.
