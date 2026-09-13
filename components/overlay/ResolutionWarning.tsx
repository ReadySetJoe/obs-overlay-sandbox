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
 * shows at most once per source per session rather than nagging.
 */
export default function ResolutionWarning() {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );

  useEffect(() => {
    const storageKey = `obs-resolution-warning:${window.location.pathname}`;

    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    let debounceTimer: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      const offBy =
        Math.abs(width - EXPECTED_WIDTH) / EXPECTED_WIDTH > TOLERANCE ||
        Math.abs(height - EXPECTED_HEIGHT) / EXPECTED_HEIGHT > TOLERANCE;

      if (!offBy) return;
      if (sessionStorage.getItem(storageKey)) return;

      sessionStorage.setItem(storageKey, '1');
      setSize({ width, height });
      hideTimer = setTimeout(() => setSize(null), VISIBLE_MS);
    };

    const onResize = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(check, RESIZE_DEBOUNCE_MS);
    };

    check();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      clearTimeout(hideTimer);
      clearTimeout(debounceTimer);
    };
  }, []);

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
