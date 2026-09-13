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

    // The badge disappears only once the socket connected, which is the same
    // handler that emits join-session - so this is an exact signal that the
    // page is in the room. An emit before that is silently lost, because the
    // server relays live and does not replay on join.
    await expect(page.getByTestId('connection-status')).toHaveCount(0, {
      timeout: 15000,
    });

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

    // Now pause, using the production payload shape - no timestamp, but
    // progress and duration present (see pages/api/spotify/now-playing.ts).
    socket.emit('now-playing', {
      title: TRACK.title,
      artist: TRACK.artist,
      albumArt: TRACK.albumArt,
      isPlaying: false,
      progress: TRACK.progress,
      duration: TRACK.duration,
    });
    await page.waitForTimeout(2000); // longer than the 500ms hide timer

    await expect(title).toBeVisible();

    // The panel must actually be on screen, not merely mounted - before the fix
    // it stayed mounted at opacity-0.
    const opacity = await page
      .getByTestId('now-playing-panel')
      .evaluate(el => window.getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0.5);

    // And the state must read as paused. Scoped by test id because the fixture
    // title "Paused Track" also contains the word "Paused".
    await expect(page.getByTestId('now-playing-state')).toHaveText(/Paused/);
  });

  test('keeps the progress bar position when paused', async ({ page }) => {
    await page.goto(`/overlay/${TEST_SESSION_ID}/now-playing`);
    await expect(page.getByTestId('connection-status')).toHaveCount(0, {
      timeout: 15000,
    });

    socket = await connectTestSocket(TEST_SESSION_ID);

    socket.emit('scene-toggle', { layerId: 'nowplaying', visible: true });
    await page.waitForTimeout(500);

    socket.emit('now-playing', { ...TRACK, isPlaying: true });
    await expect(page.getByText('Paused Track')).toBeVisible({
      timeout: 10000,
    });

    // Production shape: no timestamp, but progress and duration present.
    socket.emit('now-playing', {
      title: TRACK.title,
      artist: TRACK.artist,
      albumArt: TRACK.albumArt,
      isPlaying: false,
      progress: TRACK.progress,
      duration: TRACK.duration,
    });

    await expect(page.getByTestId('now-playing-state')).toHaveText(/Paused/);

    // Without duration in the payload, progressPercent falls to 0 and the bar
    // collapses to empty. It should stay where playback stopped.
    const width = await page
      .locator('div.bg-white.bg-opacity-60')
      .evaluate(el => (el as HTMLElement).style.width);
    expect(width).not.toBe('0%');
    expect(width).not.toBe('');
  });
});
