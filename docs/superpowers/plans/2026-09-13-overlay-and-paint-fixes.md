# Overlay & Paint Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship items 2, 3, 5 and 6 from the design spec — a reconnect hint on the overlay disconnected badge, a resolution mismatch warning, Now Playing persisting while paused, and the Paint by Numbers adjustments.

**Architecture:** Two new small overlay components (`ConnectionStatus`, `ResolutionWarning`) replace a block of markup that is currently copy-pasted byte-identically across 12 overlay pages. Two single-component behaviour fixes. One new focused module holds the paint grid bounds so the dashboard slider and the overlay agree on a single source of truth.

**Tech Stack:** Next.js 16 (Pages Router), React 19, TypeScript, Tailwind CSS 4, Socket.io, Playwright.

**Related spec:** `docs/superpowers/specs/2026-09-13-dashboard-and-overlay-improvements-design.md`

**Not in this plan:** Items 1 and 4 (dashboard reorganisation and visibility UX). They are larger than everything here combined and get their own plan.

---

## Pre-flight

Every task's tests need a database and a dev server. Run once at the start of the session:

```bash
docker compose up -d
export DATABASE_URL="postgresql://obs_user:obs_password@localhost:5432/obs_overlay"
npx prisma migrate deploy
```

`playwright.config.ts` starts the dev server itself, so do not start one manually — a stray `npm run dev` holds Prisma's query engine DLL open on Windows and makes `npm run build` fail with `EPERM`.

Every test command below assumes `DATABASE_URL` is exported in the shell.

**Baseline to preserve: 36 passed, 6 skipped, 0 failed.**

---

## File Structure

| File | Responsibility |
|---|---|
| Create: `components/overlay/ConnectionStatus.tsx` | The disconnected badge and its reconnect hint. Sole owner of that markup. |
| Create: `components/overlay/ResolutionWarning.tsx` | Detects and reports a browser-source size that is not 1920×1080. Self-contained; no props. |
| Create: `lib/paintGrid.ts` | Paint grid bounds and clamping. Single source of truth shared by the dashboard slider and the overlay defaults. |
| Create: `tests/utils/socket-client.ts` | Node-side Socket.io client for tests, so specs can inject overlay events deterministically. |
| Create: `tests/e2e/overlay/connection-status.spec.ts` | Tests for the badge + hint. |
| Create: `tests/e2e/overlay/resolution-warning.spec.ts` | Tests for the resolution warning. |
| Create: `tests/e2e/overlay/now-playing-paused.spec.ts` | Test that Now Playing survives a pause. |
| Create: `tests/unit/paint-grid.spec.ts` | Unit tests for `clampGridSize`. |
| Modify: 13 overlay pages | Replace inlined badge with the two components. `wheel.tsx` has no badge today and gains both. |
| Modify: `components/overlay/NowPlaying.tsx:17,22-29` | Decouple visibility from `isPlaying`. |
| Modify: `components/overlay/PaintByNumbers.tsx:167-181` | Drop the title, enlarge the instructions. |
| Modify: `components/dashboard/expanded/PaintByNumbersExpanded.tsx:84,516-523` | Cap the slider, lower the default. |
| Modify: `hooks/useOverlaySocket.ts:53` | Clamp persisted `gridSize` on load. |

The 13 overlay pages are (note: `wheel.tsx` had no badge to replace, so Task 1 covers 12 and Task 2 covers all 13):

```
pages/overlay/[sessionId].tsx
pages/overlay/[sessionId]/alerts.tsx
pages/overlay/[sessionId]/background.tsx
pages/overlay/[sessionId]/chat-highlight.tsx
pages/overlay/[sessionId]/countdown.tsx
pages/overlay/[sessionId]/emote-wall.tsx
pages/overlay/[sessionId]/event-labels.tsx
pages/overlay/[sessionId]/now-playing.tsx
pages/overlay/[sessionId]/paint-by-numbers.tsx
pages/overlay/[sessionId]/stream-stats.tsx
pages/overlay/[sessionId]/tts.tsx
pages/overlay/[sessionId]/weather.tsx
pages/overlay/[sessionId]/wheel.tsx
```

---

## Task 1: Extract `ConnectionStatus` and add the reconnect hint

All 12 pages contain this exact block (verified byte-identical):

```tsx
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}
```

**Files:**
- Create: `components/overlay/ConnectionStatus.tsx`
- Create: `tests/e2e/overlay/connection-status.spec.ts`
- Modify: all 12 overlay pages listed above

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/overlay/connection-status.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID } from '../../fixtures/auth';

/**
 * The socket endpoint is aborted before navigation, so the overlay can never
 * connect and isConnected stays false. This is deterministic - waiting for a
 * real disconnect would depend on Socket.io's 60s pingTimeout.
 */
test.describe('Overlay connection status', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('shows the reconnect hint when the socket cannot connect', async ({
    page,
  }) => {
    await page.route('**/api/socket**', route => route.abort());

    await page.goto(`/overlay/${TEST_SESSION_ID}/chat-highlight`);

    await expect(page.getByText('Disconnected')).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByText('Try toggling browser source visibility to reconnect')
    ).toBeVisible();
  });

  test('shows no badge once connected', async ({ page }) => {
    await page.goto(`/overlay/${TEST_SESSION_ID}/chat-highlight`);
    await page.waitForTimeout(3000);

    await expect(page.getByText('Disconnected')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test tests/e2e/overlay/connection-status.spec.ts --reporter=list
```

Expected: the first test FAILS — "Disconnected" is found but the hint text is not. The second test should already PASS.

- [ ] **Step 3: Create the component**

Create `components/overlay/ConnectionStatus.tsx`:

```tsx
// components/overlay/ConnectionStatus.tsx

interface ConnectionStatusProps {
  isConnected: boolean;
}

/**
 * Disconnected badge for overlay pages.
 *
 * Previously this markup was copy-pasted into all 12 overlay pages, which is
 * why the reconnect hint lives here: one place to change.
 */
export default function ConnectionStatus({
  isConnected,
}: ConnectionStatusProps) {
  if (isConnected) return null;

  return (
    <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
      <div className='font-semibold'>Disconnected</div>
      <div className='text-xs text-red-100 mt-0.5'>
        Try toggling browser source visibility to reconnect
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace the inlined block in all 12 pages**

Do this mechanically rather than by hand, so a typo cannot slip into one of twelve files. Write this script to the scratch directory and run it from the repo root:

```js
// scratch/replace-badge.js
const fs = require('fs');
const LF = String.fromCharCode(10);

const FILES = [
  'pages/overlay/[sessionId].tsx',
  'pages/overlay/[sessionId]/alerts.tsx',
  'pages/overlay/[sessionId]/background.tsx',
  'pages/overlay/[sessionId]/chat-highlight.tsx',
  'pages/overlay/[sessionId]/countdown.tsx',
  'pages/overlay/[sessionId]/emote-wall.tsx',
  'pages/overlay/[sessionId]/event-labels.tsx',
  'pages/overlay/[sessionId]/now-playing.tsx',
  'pages/overlay/[sessionId]/paint-by-numbers.tsx',
  'pages/overlay/[sessionId]/stream-stats.tsx',
  'pages/overlay/[sessionId]/tts.tsx',
  'pages/overlay/[sessionId]/weather.tsx',
];

const OLD = [
  '      {!isConnected && (',
  "        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>",
  '          Disconnected',
  '        </div>',
  '      )}',
].join(LF);

const NEW = '      <ConnectionStatus isConnected={isConnected} />';

const IMPORT = "import ConnectionStatus from '@/components/overlay/ConnectionStatus';";

let failed = 0;
for (const file of FILES) {
  let s = fs.readFileSync(file, 'utf8');

  const hits = s.split(OLD).length - 1;
  if (hits !== 1) {
    console.log('SKIP ' + file + ': badge matched ' + hits + 'x (expected 1)');
    failed++;
    continue;
  }
  s = s.split(OLD).join(NEW);

  // Insert the import after the last existing import line.
  const lines = s.split(LF);
  let lastImport = -1;
  lines.forEach((l, i) => {
    if (l.startsWith('import ')) lastImport = i;
  });
  if (lastImport === -1) {
    console.log('SKIP ' + file + ': no import lines found');
    failed++;
    continue;
  }
  lines.splice(lastImport + 1, 0, IMPORT);

  fs.writeFileSync(file, lines.join(LF));
  console.log('OK   ' + file);
}
process.exit(failed ? 1 : 0);
```

Run it:

```bash
node scratch/replace-badge.js
```

Expected: 12 lines of `OK`, exit 0. If any line says `SKIP`, stop and inspect that file — do not proceed with a partial replacement.

> **Known defect in this script, recorded for anyone replaying this plan.** The "insert after the last line starting with `import`" heuristic splices the import *into* a multi-line `import { ... }` block in `pages/overlay/[sessionId].tsx`, producing invalid syntax. The script still reports `OK`, because its guard only validates that the badge matched once - it never validates the output. Only `npm run type-check` catches it. Task 2 anchors on the `ConnectionStatus` import line instead; prefer that approach. Run `npm run type-check` before committing.

- [ ] **Step 5: Verify no inlined badge remains**

```bash
grep -rn "bg-red-600 text-white px-4 py-2" pages/overlay/ || echo "clean"
```

Expected: `clean`.

- [ ] **Step 6: Run type-check and the test**

```bash
npm run type-check
npx playwright test tests/e2e/overlay/connection-status.spec.ts --reporter=list
```

Expected: type-check exits 0; both tests PASS.

- [ ] **Step 7: Run the full suite for regressions**

```bash
npx playwright test --reporter=line
```

Expected: `38 passed, 6 skipped` (36 baseline + 2 new).

- [ ] **Step 8: Commit**

```bash
git add components/overlay/ConnectionStatus.tsx tests/e2e/overlay/connection-status.spec.ts pages/overlay/
git commit -m "feat(overlay): add reconnect hint to the disconnected badge

Extract the badge into components/overlay/ConnectionStatus.tsx. It was
copy-pasted byte-identically into all 12 overlay pages, so the hint text
would otherwise have to be added twelve times."
```

---

## Task 2: Resolution mismatch warning

**Files:**
- Create: `components/overlay/ResolutionWarning.tsx`
- Create: `tests/e2e/overlay/resolution-warning.spec.ts`
- Modify: all 13 overlay pages

The component takes **no props** — it derives its `sessionStorage` key from `window.location.pathname`, which keeps the 13-file wiring to a single self-closing tag.

- [ ] **Step 1: Write the failing test**

Create `tests/e2e/overlay/resolution-warning.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID } from '../../fixtures/auth';

const WARNING = /overlays are designed for 1920×1080/i;

test.describe('Overlay resolution warning', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('warns when the browser source is not 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/overlay/${TEST_SESSION_ID}/weather`);

    await expect(page.getByText(WARNING)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/1280×720/)).toBeVisible();
  });

  test('stays silent at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/overlay/${TEST_SESSION_ID}/weather`);

    // Positive control: without this, a page that rendered nothing at all
    // would satisfy the count assertion below.
    await expect(page.locator('div.relative.w-screen')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByTestId('resolution-warning')).toHaveCount(0);
  });

  test('stays silent within the 5% tolerance', async ({ page }) => {
    // 1900x1070 is inside tolerance on both axes.
    await page.setViewportSize({ width: 1900, height: 1070 });
    await page.goto(`/overlay/${TEST_SESSION_ID}/weather`);

    await expect(page.locator('div.relative.w-screen')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByTestId('resolution-warning')).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test tests/e2e/overlay/resolution-warning.spec.ts --reporter=list
```

Expected: the first test FAILS (no such text anywhere). Tests 2 and 3 pass trivially.

- [ ] **Step 3: Create the component**

Create `components/overlay/ResolutionWarning.tsx`:

```tsx
// components/overlay/ResolutionWarning.tsx
import { useEffect, useState } from 'react';

const EXPECTED_WIDTH = 1920;
const EXPECTED_HEIGHT = 1080;

/** Fraction either axis may deviate before we say anything. */
const TOLERANCE = 0.05;

/** How long the warning stays on screen. */
const VISIBLE_MS = 10000;

const RESIZE_DEBOUNCE_MS = 400;

/**
 * Warns when a browser source is not sized 1920x1080.
 *
 * Deliberately advisory, not insistent: sizing an individual element's source
 * smaller (say 500x500 for one widget) is legitimate, so this auto-hides and
 * warns at most once per path+size in localStorage rather than nagging.
 */
export default function ResolutionWarning() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const offBy =
        Math.abs(width - EXPECTED_WIDTH) / EXPECTED_WIDTH > TOLERANCE ||
        Math.abs(height - EXPECTED_HEIGHT) / EXPECTED_HEIGHT > TOLERANCE;

      if (!offBy) return;

      // localStorage, not sessionStorage: the README recommends "Shutdown
      // source when not visible", which destroys the browsing context on every
      // scene switch and would wipe sessionStorage - making this guard inert
      // exactly where it matters. This banner is composited into the
      // broadcast, so repeating it in front of viewers is the worst outcome.
      //
      // Keyed on the observed size as well as the path, because all OBS
      // browser sources share one CEF cache directory and therefore share
      // localStorage per origin. Two sources on the same URL at different
      // sizes must decide independently, and a *different* wrong size is new
      // information worth reporting.
      const storageKey = `obs-resolution-warning:${window.location.pathname}:${width}x${height}`;

      let alreadyWarned = false;
      try {
        alreadyWarned = localStorage.getItem(storageKey) !== null;
        localStorage.setItem(storageKey, '1');
      } catch {
        // Storage unavailable or over quota. Warn anyway rather than throw:
        // there is no error boundary in pages/_app.tsx, so an exception here
        // would unmount the overlay and black out a live browser source.
      }

      if (alreadyWarned) return;

      setSize({ width, height });
    };

    const onResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(check, RESIZE_DEBOUNCE_MS);
    };

    check();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(debounceTimer);
    };
  }, []);

  // Auto-hide in its own effect keyed on `size`, so a second warning cannot be
  // cut short by the previous one's orphaned timer.
  useEffect(() => {
    if (!size) return;
    const timer = setTimeout(() => setSize(null), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [size]);

  if (!size) return null;

  return (
    <div
      data-testid='resolution-warning'
      className='fixed bottom-4 left-4 bg-amber-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 pointer-events-none max-w-sm'
    >
      <div className='font-semibold'>
        Browser source is {size.width}×{size.height}
      </div>
      <div className='text-xs text-amber-100 mt-0.5'>
        These overlays are designed for 1920×1080. Set the browser source width
        and height to match.
      </div>
    </div>
  );
}
```

Note the warning copy contains "overlays are designed for 1920×1080", which is what the test's `WARNING` regex matches. The `×` characters are U+00D7 multiplication signs, not the letter x — keep them consistent between component and test.

- [ ] **Step 4: Wire it into all 13 pages**

The component renders next to `ConnectionStatus`, which Task 1 placed identically in all 13 files. Write and run:

```js
// scratch/add-resolution-warning.js
const fs = require('fs');
const LF = String.fromCharCode(10);

const FILES = [
  'pages/overlay/[sessionId].tsx',
  'pages/overlay/[sessionId]/alerts.tsx',
  'pages/overlay/[sessionId]/background.tsx',
  'pages/overlay/[sessionId]/chat-highlight.tsx',
  'pages/overlay/[sessionId]/countdown.tsx',
  'pages/overlay/[sessionId]/emote-wall.tsx',
  'pages/overlay/[sessionId]/event-labels.tsx',
  'pages/overlay/[sessionId]/now-playing.tsx',
  'pages/overlay/[sessionId]/paint-by-numbers.tsx',
  'pages/overlay/[sessionId]/stream-stats.tsx',
  'pages/overlay/[sessionId]/tts.tsx',
  'pages/overlay/[sessionId]/weather.tsx',
  'pages/overlay/[sessionId]/wheel.tsx',
];

const ANCHOR = '      <ConnectionStatus isConnected={isConnected} />';
const REPLACEMENT = [
  ANCHOR,
  '      <ResolutionWarning />',
].join(LF);

const IMPORT =
  "import ResolutionWarning from '@/components/overlay/ResolutionWarning';";

const CONNECTION_IMPORT =
  "import ConnectionStatus from '@/components/overlay/ConnectionStatus';";

let failed = 0;
for (const file of FILES) {
  let s = fs.readFileSync(file, 'utf8');

  const hits = s.split(ANCHOR).length - 1;
  if (hits !== 1) {
    console.log('SKIP ' + file + ': anchor matched ' + hits + 'x');
    failed++;
    continue;
  }
  s = s.split(ANCHOR).join(REPLACEMENT);

  // Anchor on the single-line ConnectionStatus import that Task 1 inserted.
  // Do NOT use "the last line starting with import": several of these files
  // end their import section with a multi-line `import { ... }` block, and
  // splicing into the middle of one produces invalid syntax that this
  // script cannot detect (it broke pages/overlay/[sessionId].tsx in Task 1).
  const lines = s.split(LF);
  const anchorIdx = lines.findIndex(l => l === CONNECTION_IMPORT);
  if (anchorIdx === -1) {
    console.log('SKIP ' + file + ': ConnectionStatus import not found');
    failed++;
    continue;
  }
  lines.splice(anchorIdx + 1, 0, IMPORT);

  fs.writeFileSync(file, lines.join(LF));
  console.log('OK   ' + file);
}
process.exit(failed ? 1 : 0);
```

```bash
node scratch/add-resolution-warning.js
```

Expected: 13 × `OK`, exit 0.

**Then immediately run `npm run type-check`.** These codemod scripts validate their *input* match but never their *output* - that is exactly how Task 1 silently produced an invalid file while reporting `OK`. Treat a clean type-check as part of this step, not a later one.

- [ ] **Step 5: Run type-check and the test**

```bash
npm run type-check
npx playwright test tests/e2e/overlay/resolution-warning.spec.ts --reporter=list
```

Expected: type-check exits 0; all 3 tests PASS.

- [ ] **Step 6: Run the FULL suite — this change has a suite-wide side effect**

`playwright.config.ts:45` uses `devices['Desktop Chrome']`, whose default viewport is **1280x720**. That is outside the 5% tolerance, so this warning will now render on **every** overlay page that any spec loads - 8 existing spec files do so. That is correct behaviour, not a bug, but it means new DOM appears in tests that never had it.

```bash
npx playwright test --reporter=line
```

Expected: `41 passed, 6 skipped` (38 + 3 new).

If anything fails, the likely cause is a locator that is now ambiguous because the warning added matching text, or a strict-mode violation. Fix by making the *existing* spec's locator more specific - do NOT suppress the warning in tests, and do NOT change the tolerance to dodge the problem. Report what you changed and why.

- [ ] **Step 7: Commit**

```bash
git add components/overlay/ResolutionWarning.tsx tests/e2e/overlay/resolution-warning.spec.ts pages/overlay/
git commit -m "feat(overlay): warn when the browser source is not 1920x1080

Advisory only: auto-hides after 10s, allows 5% deviation, and shows at
most once per source per session. Sizing a single widget's source
smaller is legitimate, so this must not nag."
```

---

## Task 3: Node-side socket client for tests

Task 4 needs to push a `now-playing` event into a session room. The existing helpers cannot: `exposeSocketStatus` and `waitForSocketEvent` in `tests/utils/test-helpers.ts` both depend on `window.socket`, which **the application never assigns** — `hooks/useSocket.ts` keeps the socket in React state only. `waitForSocketEvent` therefore always rejects with "Socket not available on window".

Rather than add a test-only hook to production code, connect from Node. `socket.io-client` is already a production dependency.

**Files:**
- Create: `tests/utils/socket-client.ts`

- [ ] **Step 1: Create the helper**

```ts
// tests/utils/socket-client.ts
import { io, Socket } from 'socket.io-client';

/**
 * Connect a Socket.io client from the test process (not the browser) and join a
 * session room, so specs can inject overlay events deterministically.
 *
 * The browser-based helpers in test-helpers.ts cannot do this: they read
 * window.socket, which the app never sets.
 *
 * Note the server relays with io.to(sessionId), which includes the sender, so
 * an event emitted here reaches every overlay page in the same session.
 */
export async function connectTestSocket(
  sessionId: string,
  baseURL = 'http://localhost:3000'
): Promise<Socket> {
  // Ensure the Socket.io server has been initialised; the app does this by
  // hitting the same endpoint before connecting.
  await fetch(`${baseURL}/api/socket`);

  const socket = io(baseURL, {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Test socket failed to connect within 10s')),
      10000
    );
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });

  socket.emit('join-session', sessionId);

  return socket;
}
```

- [ ] **Step 2: Verify it type-checks**

```bash
npm run type-check
```

Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add tests/utils/socket-client.ts
git commit -m "test: add a Node-side socket client helper

The existing browser helpers read window.socket, which the app never
assigns, so waitForSocketEvent always rejects. Connecting from the test
process instead lets specs inject overlay events deterministically."
```

---

## Task 4: Now Playing persists while paused

Root cause, already traced: `components/overlay/NowPlaying.tsx:22-29` flips `isVisible` to false 500 ms after `isPlaying` goes false, and line 110 then applies `translate-y-full opacity-0`. The track data is fine — `hooks/useSpotify.ts:105-112` retains title, artist and album art on pause.

**Files:**
- Create: `tests/e2e/overlay/now-playing-paused.spec.ts`
- Modify: `components/overlay/NowPlaying.tsx:17,22-29`

- [ ] **Step 1: Write the failing test**

```ts
// tests/e2e/overlay/now-playing-paused.spec.ts
import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID } from '../../fixtures/auth';
import { connectTestSocket } from '../../utils/socket-client';
import type { Socket } from 'socket.io-client';

const TRACK = {
  title: 'Paused Track',
  artist: 'Test Artist',
  albumArt: '',
  progress: 30000,
  duration: 210000,
  timestamp: Date.now(),
};

test.describe('Now Playing while paused', () => {
  let socket: Socket;

  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test.afterEach(() => {
    socket?.disconnect();
  });

  test('stays visible when the track is paused', async ({ page }) => {
    await page.goto(`/overlay/${TEST_SESSION_ID}/now-playing`);
    await page.waitForTimeout(3000); // let the overlay join its room

    socket = await connectTestSocket(TEST_SESSION_ID);

    // Playing first, so the element mounts and animates in.
    socket.emit('now-playing', { ...TRACK, isPlaying: true });
    const title = page.getByText('Paused Track');
    await expect(title).toBeVisible({ timeout: 10000 });

    // Now pause. Before the fix this slid the element off-screen.
    socket.emit('now-playing', { ...TRACK, isPlaying: false });
    await page.waitForTimeout(2000); // longer than the 500ms hide timer

    await expect(title).toBeVisible();

    // Asserting presence alone would have passed before the fix, because the
    // component stayed mounted at opacity-0. Assert it is actually on screen.
    const opacity = await title.evaluate(el => {
      const panel = el.closest('div[class*="fixed"]');
      return panel ? window.getComputedStyle(panel).opacity : '0';
    });
    expect(Number(opacity)).toBeGreaterThan(0.5);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test tests/e2e/overlay/now-playing-paused.spec.ts --reporter=list
```

Expected: FAIL on the opacity assertion (or on the second `toBeVisible`), because the element animates out on pause.

- [ ] **Step 3: Fix the component**

In `components/overlay/NowPlaying.tsx`, replace the effect at lines 22-29:

```tsx
  useEffect(() => {
    if (track?.isPlaying) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [track?.isPlaying]);
```

with:

```tsx
  // Visibility follows "do we have a track", not "is it playing". Pausing used
  // to animate the element off-screen, which meant the widget vanished
  // mid-stream; the only intended way to hide it is toggling the layer off.
  //
  // The title check guards the initial state: useSpotify emits empty strings
  // before anything has played.
  const hasTrack = Boolean(track?.title);

  useEffect(() => {
    if (hasTrack) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 500);
      return () => clearTimeout(timer);
    }
  }, [hasTrack]);
```

- [ ] **Step 4: Add the paused affordance**

Still in `NowPlaying.tsx`, find the outer panel `div` whose className contains

```
        fixed ${positionClasses[layout.position]} transform transition-all duration-500
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
```

and change the visible branch so a paused track reads as paused without disappearing:

```
        fixed ${positionClasses[layout.position]} transform transition-all duration-500
        ${
          isVisible
            ? track.isPlaying
              ? 'translate-y-0 opacity-100'
              : 'translate-y-0 opacity-70'
            : 'translate-y-full opacity-0'
        }
```

Then add the paused glyph the spec calls for, so the state reads on stream rather than relying on opacity alone. Inside the panel, beside the track title, render:

```tsx
        {!track.isPlaying && (
          <span className='ml-2 text-xs font-semibold uppercase tracking-wide opacity-80'>
            &#10074;&#10074; Paused
          </span>
        )}
```

The progress bar already freezes on pause: the interval effect at `NowPlaying.tsx:66-90` returns early when `!track.isPlaying`. No change needed there.

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx playwright test tests/e2e/overlay/now-playing-paused.spec.ts --reporter=list
```

Expected: PASS. Opacity will be 0.7, which satisfies `> 0.5`.

- [ ] **Step 6: Commit**

```bash
git add components/overlay/NowPlaying.tsx tests/e2e/overlay/now-playing-paused.spec.ts
git commit -m "fix(overlay): keep Now Playing on screen while paused

Visibility was driven by track.isPlaying, so pausing animated the widget
off-screen (translate-y-full opacity-0) 500ms later. The track data was
never the problem - useSpotify already retains it on pause.

Visibility now follows whether a track exists. Paused renders at 70%
opacity so the state still reads on stream."
```

---

## Task 5: Cap the paint grid size at 12px

`componentLayouts.paintByNumbers.gridSize` is persisted as JSON on the `Layout` row, and existing sessions hold values up to 40. Lowering the slider max without clamping would feed out-of-range values into the control, so the bound and the clamp live together in one module.

**Files:**
- Create: `lib/paintGrid.ts`
- Create: `tests/unit/paint-grid.spec.ts`
- Modify: `components/dashboard/expanded/PaintByNumbersExpanded.tsx:84,516-523`
- Modify: `hooks/useOverlaySocket.ts:53`

- [ ] **Step 1: Write the failing unit test**

Playwright is the test runner for this repo; a spec with no `page` fixture runs as a plain Node test.

```ts
// tests/unit/paint-grid.spec.ts
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
```

- [ ] **Step 2: Run it to verify it fails**

```bash
npx playwright test tests/unit/paint-grid.spec.ts --reporter=list
```

Expected: FAIL — cannot resolve `@/lib/paintGrid`.

- [ ] **Step 3: Create the module**

```ts
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
```

- [ ] **Step 4: Run it to verify it passes**

```bash
npx playwright test tests/unit/paint-grid.spec.ts --reporter=list
```

Expected: 6 tests PASS.

- [ ] **Step 5: Apply the cap to the dashboard slider**

In `components/dashboard/expanded/PaintByNumbersExpanded.tsx`, add to the imports:

```ts
import {
  PAINT_GRID_SIZE_MIN,
  PAINT_GRID_SIZE_MAX,
  DEFAULT_PAINT_GRID_SIZE,
  clampGridSize,
} from '@/lib/paintGrid';
```

Change the default at line 84 from `gridSize: 20,` to:

```ts
    gridSize: DEFAULT_PAINT_GRID_SIZE,
```

Replace the slider (lines 516-523) so the bounds come from the module and the displayed value is clamped:

```tsx
            <label className='block text-xs text-gray-400 mb-1'>
              Grid Size: {clampGridSize(layout.gridSize)}px
            </label>
            <input
              type='range'
              min={PAINT_GRID_SIZE_MIN}
              max={PAINT_GRID_SIZE_MAX}
              step='1'
              value={clampGridSize(layout.gridSize)}
              onChange={e =>
                onGridSizeChange(clampGridSize(parseInt(e.target.value)))
              }
              className='w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500'
            />
```

- [ ] **Step 6: Clamp on load in the overlay hook**

In `hooks/useOverlaySocket.ts`, add to the imports:

```ts
import { clampGridSize, DEFAULT_PAINT_GRID_SIZE } from '@/lib/paintGrid';
```

Change line 53 from `gridSize: 20,` to:

```ts
      gridSize: DEFAULT_PAINT_GRID_SIZE,
```

There are **two** paths by which an unclamped value can reach the overlay. Clamp both.

**Path 1 - initial load from the database.** `parsedLayouts` is produced at `hooks/useOverlaySocket.ts:195`:

```ts
              const parsedLayouts = JSON.parse(layout.componentLayouts);
```

Insert immediately after that line:

```ts
              if (parsedLayouts.paintByNumbers) {
                parsedLayouts.paintByNumbers = {
                  ...parsedLayouts.paintByNumbers,
                  gridSize: clampGridSize(parsedLayouts.paintByNumbers.gridSize),
                };
              }
```

**Path 2 - the `component-layouts` socket event.** At `hooks/useOverlaySocket.ts:413` the handler stores the incoming payload wholesale:

```ts
      setComponentLayouts(layouts);
```

Replace it with:

```ts
      setComponentLayouts({
        ...layouts,
        ...(layouts.paintByNumbers && {
          paintByNumbers: {
            ...layouts.paintByNumbers,
            gridSize: clampGridSize(layouts.paintByNumbers.gridSize),
          },
        }),
      });
```

Path 2 matters because a dashboard that loaded an old layout before this change could broadcast an unclamped value to overlays.

- [ ] **Step 7: Verify no stale bounds remain**

```bash
grep -rn "gridSize: 20\|max='40'" components hooks || echo "clean"
npm run type-check
```

Expected: `clean`, and type-check exits 0.

- [ ] **Step 8: Run the paint specs and the full suite**

```bash
npx playwright test tests/unit/paint-grid.spec.ts tests/e2e/realtime/paint-by-numbers.spec.ts --reporter=list
npx playwright test --reporter=line
```

Expected: paint specs PASS; full suite shows no failures.

- [ ] **Step 9: Commit**

```bash
git add lib/paintGrid.ts tests/unit/paint-grid.spec.ts components/dashboard/expanded/PaintByNumbersExpanded.tsx hooks/useOverlaySocket.ts
git commit -m "feat(paint): cap grid size at 12px

Grid size is persisted in componentLayouts JSON and existing sessions
hold values up to 40, so the cap needs a clamp on read as well as a
lower slider max. Bounds and clamp live together in lib/paintGrid.ts so
the dashboard and the overlay cannot disagree."
```

---

## Task 6: Paint by Numbers overlay — drop the title, enlarge the instructions

**Files:**
- Modify: `components/overlay/PaintByNumbers.tsx:167-181`

- [ ] **Step 1: Make the change**

Replace this block (the header, at lines 167-181):

```tsx
          {/* Header */}
          <div className='mb-4 text-center'>
            <h3
              className='text-2xl font-bold bg-clip-text text-transparent'
              style={{ backgroundImage: theme.gradientText }}
            >
              Paint by Numbers
            </h3>
            <p className='text-sm text-gray-400 mt-1'>
              Type{' '}
              <span className='font-mono' style={{ color: theme.accentText }}>
                !paint [number] [color]
              </span>{' '}
              in chat!
            </p>
          </div>
```

with:

```tsx
          {/* Header - the title is implied by the grid, so the space goes to
              the instructions, which viewers actually need to read. */}
          <div className='mb-4 text-center'>
            <p className='text-xl font-semibold text-gray-200'>
              Type{' '}
              <span className='font-mono' style={{ color: theme.accentText }}>
                !paint [number] [color]
              </span>{' '}
              in chat!
            </p>
          </div>
```

- [ ] **Step 2: Verify the title is gone and `theme` is still used**

```bash
grep -n "Paint by Numbers" components/overlay/PaintByNumbers.tsx || echo "title removed"
grep -c "theme\." components/overlay/PaintByNumbers.tsx
```

Expected: `title removed`, and a `theme.` count of **4**.

It was 5 before the change, and `theme.gradientText` - the only use inside the removed header - accounts for exactly one. So `useThemeColors` stays; do not remove it. A count of 0 means something else was deleted by mistake.

- [ ] **Step 3: Run type-check, lint and the paint specs**

```bash
npm run type-check
npm run lint
npx playwright test tests/e2e/realtime/paint-by-numbers.spec.ts --reporter=list
```

Expected: type-check exits 0; lint reports 0 errors; paint specs PASS.

- [ ] **Step 4: Try enabling the skipped template-selection specs**

`tests/e2e/realtime/paint-by-numbers.spec.ts:166` and `:196` are currently skipped (`test.skip`) and cover template selection — the one path the lazy-loading change in `1374159` did not verify. Change `test.skip` to `test` for both and run:

```bash
npx playwright test tests/e2e/realtime/paint-by-numbers.spec.ts --reporter=list
```

If they pass, keep them enabled — that closes a real coverage gap. If they fail for reasons unrelated to this task, revert them to `test.skip` and note why in the commit message rather than fixing them here.

- [ ] **Step 5: Commit**

```bash
git add components/overlay/PaintByNumbers.tsx tests/e2e/realtime/paint-by-numbers.spec.ts
git commit -m "feat(paint): drop the overlay title, enlarge the instructions

The grid makes 'Paint by Numbers' obvious; the chat command is what
viewers need to read. Reclaims the title's space for it."
```

---

## Final verification

- [ ] **Run every gate the CI workflow runs**

```bash
npm run type-check
npm run lint
npm run build
npm audit --audit-level=critical
npx playwright test --reporter=line
```

Expected: all exit 0. Suite should be **36 baseline + 6 new = 42 passed**, 6 skipped (or 8 passed and 4 skipped if Task 6 Step 4 enabled the two template specs).

- [ ] **Push and confirm CI is green**

```bash
git push origin main
gh run list --limit 1
```

Do not push without asking — pushing to `main` triggers a production deploy on Railway.

- [ ] **Clean up scratch scripts**

```bash
rm -f scratch/replace-badge.js scratch/add-resolution-warning.js
```

---

## Notes for the implementer

- **Windows file locks.** A running dev server holds `node_modules/.prisma/client/query_engine-windows.dll.node` open, so `npm run build` fails with `EPERM`. Stop any dev server before building. Playwright manages its own.
- **`.env` vs `.env.local`.** The Prisma CLI reads `.env`; Next reads `.env.local`. Pass `DATABASE_URL` explicitly for `prisma` commands, and never point it at the production URL in `.env.local`.
- **The `×` character** in the resolution warning is U+00D7, not the letter x. The test regex depends on it.
- **Do not "fix" the vestigial helpers.** `exposeSocketStatus` and `waitForSocketEvent` are unused-by-design here; removing them is out of scope for this plan.
