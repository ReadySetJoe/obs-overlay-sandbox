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

    // The Layout row seeded by setupTestDatabase() has nowPlayingVisible at
    // its schema default (false), which hides the whole nowplaying scene
    // layer regardless of track data. Turn the layer on before sending track
    // data, or the widget never mounts and the test fails for an unrelated
    // reason.
    socket.emit('scene-toggle', { layerId: 'nowplaying', visible: true });
    await page.waitForTimeout(500);

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

    // The opacity check alone is satisfied by full opacity too, so it doesn't
    // pin the paused affordance on its own - assert the dimming and the
    // explicit "Paused" label separately.
    await expect(page.locator('span.opacity-80', { hasText: 'Paused' })).toBeVisible();
    expect(Number(opacity)).toBeLessThan(1);
  });
});
