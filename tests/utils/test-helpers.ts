import { Page, expect } from '@playwright/test';

/**
 * Wait for socket connection to be established
 */
export async function waitForSocketConnection(page: Page, timeout = 10000) {
  // Wait for socket to connect by checking console logs or a known element
  await page.waitForFunction(
    () => {
      // Check if socket is available in window
      return (window as any).socketConnected === true;
    },
    { timeout }
  ).catch(() => {
    // Fallback: just wait a bit for socket to connect
    return page.waitForTimeout(3000);
  });
}

/**
 * Wait for a specific socket event to be emitted
 */
export async function waitForSocketEvent(
  page: Page,
  eventName: string,
  timeout = 10000
): Promise<any> {
  return await page.evaluate(
    ({ eventName, timeout }) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`Timeout waiting for socket event: ${eventName}`));
        }, timeout);

        // Access socket from window (if available)
        const socket = (window as any).socket;
        if (!socket) {
          clearTimeout(timer);
          reject(new Error('Socket not available on window'));
          return;
        }

        socket.once(eventName, (data: any) => {
          clearTimeout(timer);
          resolve(data);
        });
      });
    },
    { eventName, timeout }
  );
}

/**
 * Get the current canvas image data as base64
 * Useful for verifying visual changes in canvas elements
 */
export async function getCanvasSnapshot(page: Page, selector = 'canvas'): Promise<string> {
  return await page.evaluate((sel) => {
    const canvas = document.querySelector(sel) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Canvas not found: ${sel}`);
    return canvas.toDataURL();
  }, selector);
}

/**
 * Wait for canvas to change (useful for animations)
 */
export async function waitForCanvasChange(
  page: Page,
  selector = 'canvas',
  timeoutMs = 5000
): Promise<void> {
  const initialSnapshot = await getCanvasSnapshot(page, selector);

  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    await page.waitForTimeout(100);
    const currentSnapshot = await getCanvasSnapshot(page, selector);
    if (currentSnapshot !== initialSnapshot) {
      return; // Canvas has changed
    }
  }

  throw new Error('Canvas did not change within timeout');
}

/**
 * Check if an element is visible in the viewport
 */
export async function isElementInViewport(page: Page, selector: string): Promise<boolean> {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return false;

    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }, selector);
}

/**
 * Expose socket connection status to window for easier testing
 */
export async function exposeSocketStatus(page: Page) {
  await page.addInitScript(() => {
    // This runs before page JavaScript loads
    (window as any).socketConnected = false;

    // Monkey-patch socket connection
    const originalDefineProperty = Object.defineProperty;
    originalDefineProperty.call(Object, window, 'socket', {
      set(value) {
        if (value && value.on) {
          value.on('connect', () => {
            (window as any).socketConnected = true;
          });
          value.on('disconnect', () => {
            (window as any).socketConnected = false;
          });
        }
        (window as any)._socket = value;
      },
      get() {
        return (window as any)._socket;
      },
      configurable: true,
    });
  });
}
