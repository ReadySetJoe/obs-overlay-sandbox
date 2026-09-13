import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID } from '../../fixtures/auth';
import { connectTestSocket } from '../../utils/socket-client';
import type { Socket } from 'socket.io-client';

/**
 * Regression coverage for the paint-by-numbers grid size cap
 * (lib/paintGrid.ts, PAINT_GRID_SIZE_MAX = 12).
 *
 * PaintByNumbers.tsx sets canvas.width = (maxX + 1) * gridSize from the
 * regions' pixel extent. A single-pixel region at [0, 0] makes maxX = maxY =
 * 0, so canvas.width equals gridSize exactly - an observable DOM property
 * that differs between a clamped (12) and unclamped (40) value.
 */
const SINGLE_PIXEL_STATE = {
  templateId: 'test-template',
  regions: [{ id: 1, color: '#ff0000', pixels: [[0, 0]], filled: false }],
  startedAt: Date.now(),
};

async function getCanvasWidth(page: import('@playwright/test').Page) {
  return page.locator('canvas').evaluate(el => (el as HTMLCanvasElement).width);
}

test.describe('Paint by numbers grid size clamp', () => {
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

  test('clamps an out-of-range gridSize loaded from the database (Path 1)', async ({
    page,
  }) => {
    // Seed a layout whose persisted componentLayouts JSON carries a
    // pre-cap gridSize of 40, and turn the paint-by-numbers layer on so the
    // component actually mounts.
    await prisma.layout.update({
      where: { sessionId: TEST_SESSION_ID },
      data: {
        paintByNumbersVisible: true,
        componentLayouts: JSON.stringify({
          paintByNumbers: {
            position: 'top-left',
            x: 0,
            y: 0,
            scale: 1,
            gridSize: 40,
          },
        }),
      },
    });

    await page.goto(`/overlay/${TEST_SESSION_ID}/paint-by-numbers`);

    // The badge disappears only once the socket connected and joined the
    // session room - the same handler that emits join-session. An emit
    // before that is silently lost, since the server relays live and does
    // not replay on join.
    await expect(page.getByTestId('connection-status')).toHaveCount(0, {
      timeout: 15000,
    });

    // paintByNumbersState is never loaded from the database by
    // useOverlaySocket - it only arrives via the paint-state socket event -
    // so we still need to send it, but this does not touch
    // componentLayouts.paintByNumbers, keeping Path 1 isolated.
    socket = await connectTestSocket(TEST_SESSION_ID);
    socket.emit('paint-state', SINGLE_PIXEL_STATE);

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    await expect(async () => {
      expect(await getCanvasWidth(page)).toBe(12);
    }).toPass({ timeout: 10000 });
  });

  test('clamps an out-of-range gridSize delivered over the component-layouts socket event (Path 2)', async ({
    page,
  }) => {
    // Seed a layout with an in-range value so the initial database load
    // (Path 1) is not what produces the clamp we are asserting on here.
    await prisma.layout.update({
      where: { sessionId: TEST_SESSION_ID },
      data: {
        paintByNumbersVisible: true,
        componentLayouts: JSON.stringify({
          paintByNumbers: {
            position: 'top-left',
            x: 0,
            y: 0,
            scale: 1,
            gridSize: 8,
          },
        }),
      },
    });

    await page.goto(`/overlay/${TEST_SESSION_ID}/paint-by-numbers`);

    await expect(page.getByTestId('connection-status')).toHaveCount(0, {
      timeout: 15000,
    });

    socket = await connectTestSocket(TEST_SESSION_ID);
    socket.emit('paint-state', SINGLE_PIXEL_STATE);

    // Sanity check: the canvas is rendering at the seeded, in-range value
    // before we exercise the socket clamp.
    await expect(async () => {
      expect(await getCanvasWidth(page)).toBe(8);
    }).toPass({ timeout: 10000 });

    // component-layouts is relayed with io.to(sessionId), which includes the
    // sender, so this test process receives its own emit back through the
    // overlay page's socket connection.
    socket.emit('component-layouts', {
      paintByNumbers: {
        position: 'top-left',
        x: 0,
        y: 0,
        scale: 1,
        gridSize: 40,
      },
    });

    await expect(async () => {
      expect(await getCanvasWidth(page)).toBe(12);
    }).toPass({ timeout: 10000 });
  });
});
