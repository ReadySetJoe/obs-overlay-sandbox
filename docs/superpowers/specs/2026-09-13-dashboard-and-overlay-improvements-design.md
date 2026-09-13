# Dashboard & Overlay Improvements — Design

**Date:** 2026-09-13
**Status:** Approved for planning

## Context

Six improvements, driven by one overriding fact established during design:
**the dashboard is used live, mid-stream.** The user's live loop is

1. firing one-off effects (emote wall, wheel spin, alert test, TTS),
2. highlighting chat messages,
3. toggling elements on and off.

Appearance settings (theme, background, font) are configured before streaming
and never touched live. Every decision below follows from that.

---

## 1. Dashboard reorganisation

### Problem

Two distinct complaints, confirmed with the user:

- **Vertical sprawl.** 14 features are rendered as full-width rows (icon +
  title + subtitle + toggle) stacked in a single column inside 6
  `CollapsibleSection`s, so using the dashboard means constant scrolling.
- **Obtuse groupings.** The existing categories are uneven (3·2·2·3·3·1) and
  arbitrary: `Integrations` holds exactly one feature, `Countdown Timers` sits
  under `Interactive Features` despite being purely informational, `Stream
  Alerts` is filed under `Chat & Communication`, and `Recent Events` is
  labelled analytics when it is alert-adjacent.

Note the structure group → tile → detail panel *already exists*
(`CollapsibleSection` → `SummaryTile` → `expanded/*`). This is a reorganisation
and density change, not a new pattern.

### Design

**State is a derived view; categories are the permanent home.** Chosen over
pure state-grouping because tiles never move, preserving muscle memory.

Page structure, top to bottom:

1. **Header** — unchanged (`DashboardHeader`).
2. **"On stream now" bar** — horizontal wrap of a chip per currently-visible
   element: icon, name, ▶ fire button where applicable, and a hide control.
   Shows a count. Empty state when nothing is visible.
3. **Category grid** — 6 cards in a responsive grid. Each card holds compact
   tiles: icon, short name, visibility dot (lit/dim), ▶ where the feature has
   something to fire. Click tile → detail panel. Click dot → toggle visibility.
4. **Chat feed** — persistent panel, not behind a tile. It is a feed to scan
   and click, not a thing to configure.

   The feed and the `Chat Highlight` tile are **not duplicates** and both stay:
   the feed is the live message list (scan, click to highlight), while the tile
   owns that element's visibility, position and styling. The tile's detail panel
   should therefore drop its embedded message list, since the feed supersedes it.

**Categories** (2·2·2·3·2·3 = 14):

| Category | Features |
|---|---|
| Alerts & Events | Stream Alerts, Recent Events |
| Chat | Chat Highlight, Text to Speech |
| Viewer Games | Wheel Spinner, Paint by Numbers |
| Readouts | Stream Stats, Countdown Timers, Now Playing |
| Ambience | Weather Effects, Emote Wall |
| Appearance | Colour Scheme, Custom Background, Text Style |

`Appearance` renders last and visually de-emphasised.

Now Playing stays in `Readouts` (user decision): it displays live external data,
like Stats and Timers.

### Key architectural move: a feature registry

`pages/dashboard/[sessionId].tsx` is 905 lines, most of it repetitive
`SummaryTile` JSX. Introduce a declarative registry — `lib/dashboardFeatures.ts`
— as the single source of truth:

```ts
export interface DashboardFeature {
  id: string;                    // stable key
  name: string;                  // short label for the compact tile
  icon: ReactNode;               // from tiles/TileIcons
  category: FeatureCategory;
  visibilityLayerId: string | null;  // null = no visibility toggle
  fireAction?: { label: string; run: () => void };
}
```

The bar and the grid both render from this list. Adding a feature becomes one
entry instead of another block of JSX, and the page shrinks substantially.

**Important**: not every feature has a visibility toggle. The existing layer ids
(`LAYER_VISIBILITY_MAP` in `pages/api/layouts/save.ts`) are: `weather`, `chat`,
`nowplaying`, `countdown`, `chathighlight`, `paintbynumbers`, `eventlabels`,
`streamstats`, `wheel`, `alerts`, `tts` — 11 layers for 14 features. Emote Wall
is fire-only; Colour Scheme and Text Style are global; Custom Background is
driven by `backgroundImageUrl` rather than a layer flag. The registry must model
this with `visibilityLayerId: null`.

**Open item for implementation**: the `chat` layer id appears unused and
distinct from `chathighlight`. Confirm whether it is legacy before wiring.

### Out of scope

`AlertsExpanded.tsx` (857 lines) and `TextToSpeechExpanded.tsx` (713 lines) will
still present dozens of controls when opened. Reorganising navigation does not
address that. Flagged to the user and deliberately deferred.

---

## 2. Reconnect hint on the overlay disconnected badge

### Problem

When an overlay's socket drops, it renders a bare `Disconnected` badge with no
guidance. The fix that works — toggling the OBS browser source's visibility off
and on — is not discoverable.

### Design

The badge is currently **duplicated in 12 files**: the 11 individual overlay
pages plus `pages/overlay/[sessionId].tsx`, each with its own copy of

```tsx
{!isConnected && (
  <div className='fixed top-4 left-4 bg-red-600 ...'>Disconnected</div>
)}
```

Extract `components/overlay/ConnectionStatus.tsx` taking `isConnected`, and
replace all 12 copies. Add the hint text: *"Try toggling browser source
visibility to reconnect"* as a second line, smaller and lighter than the
heading.

Extracting first is what makes this a one-line change rather than twelve, and
it is the same reason item #3 becomes cheap.

---

## 3. Resolution mismatch warning

### Problem

Overlays are designed for a 1920×1080 browser source. Users who size the source
differently get misplaced elements with no explanation.

### Design

`components/overlay/ResolutionWarning.tsx`, rendered alongside
`ConnectionStatus` in the same 12 places.

Compares `window.innerWidth`/`innerHeight` against 1920×1080.

**Critical constraint**: a mismatch is not necessarily a mistake. Users
legitimately size an individual element's source smaller (a 500×500 source for
one widget). So the warning must be advisory and quiet:

- **Tolerance**: only warn if either dimension differs by more than 5%.
- **Timed**: auto-hide after 10 seconds, per the user's "timed warning" framing.
- **Once per source**: record dismissal in `localStorage`, keyed by pathname
  **plus the observed size**.

  This was originally specified as `sessionStorage` keyed by pathname, which
  was wrong on the facts. The README recommends "Shutdown source when not
  visible" for every overlay; that destroys the browsing context on each
  scene switch and wipes `sessionStorage`, so the guard would have been inert
  in exactly the configuration it was written for - and this banner is
  composited into the broadcast, so it would have reappeared in front of
  viewers on every scene switch. (Note the two OBS settings differ: "Refresh
  browser when scene becomes active" is a reload, which `sessionStorage`
  survives. "Shutdown when not visible" is not.)

  The observed size belongs in the key for correctness, not polish: all OBS
  browser sources share one CEF cache directory, so they share `localStorage`
  per origin. Two sources on the same URL at different sizes - a fullscreen
  background and a deliberately-small corner widget - must decide
  independently, or whichever booted first would permanently silence the
  other. Including the size also makes a *different* wrong size newly
  reportable, which is genuinely new information.

  Note the key includes the pathname, which contains the `sessionId`. So the
  guarantee is "warned once per source URL per size", not "once ever" — pointing
  a browser source at a new session will warn again at the same wrong size.
  That is the desirable behaviour (a new session is a new setup), but it is worth
  stating so it is not a surprise.

  Storage access must be wrapped in `try`/`catch` and warn anyway on failure.
  `localStorage` throws when storage is unavailable or over quota, and there
  is no error boundary in `pages/_app.tsx`, so an uncaught throw would
  unmount the overlay and black out a live browser source. A diagnostic
  banner must never be able to do that.
- **Never blocks**: positioned away from centre, does not intercept clicks.
- **Content**: reports actual vs expected, e.g. *"Browser source is 1280×720 —
  overlays are designed for 1920×1080."*

Recheck on `resize`, debounced.

Deferred, not required for this feature to ship:

- A `?resolutionWarning=off` URL opt-out, documented in the README's OBS
  Setup section. Stateless and explicit, and a better answer than any storage
  primitive for the streamer who deliberately runs a small source. The
  size-keyed guard already limits that person to one warning ever, so this is
  belt-and-braces.
- A `data-testid` on the overlay page root. The resolution tests currently
  use `div.relative.w-screen` as a positive control, which couples them to a
  Tailwind class name; a test id would serve these specs and the eight other
  overlay specs better.
- `README.md:408-421` recommends 1920x1080 for every component, which sits
  awkwardly with this section's premise that small per-widget sources are
  legitimate. One of the two should be reconciled.

---

## 4. Making visibility hard to forget

### Problem

The user forgets to make elements visible, and asked whether meaningful changes
should auto-show the element.

### Design

**Rejected: auto-showing on change.** Mid-stream, an element appearing on a live
broadcast because a slider was nudged is a bad surprise, and the dashboard is
used live. Recommended against, and the user accepted.

Instead, attack the root cause from two sides:

1. **The "On stream now" bar** (item #1) makes visibility state the first thing
   on the page. Forgetting what is visible stops being easy.
2. **Inline prompt in detail panels.** When a hidden element's settings are
   edited, its panel shows an unobtrusive inline notice: *"This isn't on stream
   — show it?"* with a button that toggles visibility. The user stays in
   control; the state is impossible to miss.

The prompt appears only when the element is hidden, and only after an actual
edit — not merely on opening the panel.

---

## 5. Now Playing persists while paused

### Problem

Pausing the music removes the element from the overlay.

### Root cause (traced, not assumed)

Not a data problem. `hooks/useSpotify.ts:105-112` already retains title, artist
and album art on pause and emits them with `isPlaying: false`.

The cause is `components/overlay/NowPlaying.tsx:22-29`:

```ts
useEffect(() => {
  if (track?.isPlaying) setIsVisible(true);
  else { const t = setTimeout(() => setIsVisible(false), 500); return () => clearTimeout(t); }
}, [track?.isPlaying]);
```

`isVisible` then drives line 110, applying `translate-y-full opacity-0` — the
element slides off-screen. It stays mounted but is animated away.

### Design

Decouple "have a track" from "is playing". `isVisible` becomes true when a track
with content exists, regardless of `isPlaying`:

- Visible whenever `track` has a `title` (guards the empty initial state, where
  `useSpotify` emits empty strings before anything has played).
- While paused: freeze the progress bar (`NowPlaying.tsx:66-90` already bails
  out when `!track.isPlaying`, so it stops advancing — correct as-is) and show a
  paused affordance. Proposal: dim to ~70% opacity plus a small pause glyph, so
  the state reads on stream without the element vanishing.
- The element still disappears when the layer is toggled off, which remains the
  only intended way to hide it.

---

## 6. Paint by Numbers adjustments

Three changes, all user-specified.

**Remove the title.** `components/overlay/PaintByNumbers.tsx:172` renders
"Paint by Numbers". Redundant — the grid makes it obvious.

**Enlarge the instructions.** Same component. Increase font size and weight so
viewers can read the chat command at a glance; reclaim the space the title used.

**Cap grid size at 12px.** Currently a slider in
`PaintByNumbersExpanded.tsx:514-521` with a default of `20`
(`PaintByNumbersExpanded.tsx:84`).

This needs care, because it is a **data-compatibility change**:

- Lower the slider `max` to 12.
- Lower the default from 20 to **12**, i.e. the new maximum, keeping new
  sessions as close as possible to today's chunkiness.
- **Clamp on read.** `componentLayouts.paintByNumbers.gridSize` is persisted as
  JSON in the `Layout` row, so existing sessions hold values from 13 to 40.
  Without clamping, a saved 20 would feed a slider whose max is 12, producing an
  out-of-range control. Clamp when the layout is loaded, so old sessions
  converge on a legal value on next save.

---

## Testing

Existing suite is the baseline: **36 passed, 6 skipped, 0 failed.** It must stay
green. Specific additions:

| Item | Verification |
|---|---|
| 1 | Existing dashboard specs exercise toggles and panels and must keep passing — they are the regression net for the reorganisation. Add a spec asserting the "On stream now" bar reflects toggles in both directions. |
| 2 | Assert the hint text renders when disconnected. Requires simulating socket loss. |
| 3 | Assert the warning shows at a non-1920×1080 viewport, stays hidden at 1920×1080, and auto-hides. Playwright can set viewport directly, so this is cheap. |
| 4 | Assert the inline prompt appears for a hidden element after an edit, and not for a visible one. |
| 5 | Assert the element remains in the DOM *and* visible (not `opacity-0`) when a track arrives with `isPlaying: false`. This is the bug: asserting presence alone would have passed before the fix. |
| 6 | Assert the slider max is 12, and that a layout persisted with `gridSize: 20` clamps on load. |

Two paint-by-numbers specs (`paint-by-numbers.spec.ts:166`, `:196`) are
currently skipped and cover template selection. Item #6 touches this component,
so enabling them is worth attempting.

---

## Sequencing

1. **Items 2 + 3** — extract `ConnectionStatus`, add `ResolutionWarning`. Small,
   self-contained, touch the same 12 files once.
2. **Items 5 + 6** — isolated single-component fixes.
3. **Item 1 + 4** — the registry, bar, grid, and inline prompt. Largest by far;
   benefits from the smaller items being settled first.

Items 1 and 4 are deliberately paired: the bar is the main answer to #4, so
splitting them would ship half an idea.

**Scope note.** Stages 1 and 2 are small and well-bounded. Stage 3 (the
registry, bar, grid and inline prompt) is substantially larger than the other
five items combined and touches the 905-line dashboard page. If planning shows
it exceeding a single reviewable change, split it into its own plan rather than
letting it sprawl: the registry and compact grid first, then the bar and inline
prompt on top.
