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
 * uses localStorage (keyed on path + observed size) to show at most once per
 * source/size rather than nagging.
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
        // Storage unavailable or over quota. Fall through without a marker so
        // we warn anyway, rather than throwing: there is no error boundary in
        // pages/_app.tsx, so an exception here would unmount the overlay and
        // black out a live browser source. Note that if getItem succeeded and
        // only setItem threw, alreadyWarned is already set and we still
        // suppress - we did genuinely read a prior marker.
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
