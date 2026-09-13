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
 *
 * page.route does not intercept WebSocket handshakes, so we also need
 * routeWebSocket to close any WebSocket upgrade attempt directly - otherwise
 * this test would only pass because aborting GET /api/socket prevents the
 * lazily-initialized Socket.io server from ever attaching (see
 * pages/api/socket.ts), which is an artifact of dev-server state, not a
 * guarantee that holds once something else in the run has already hit
 * /api/socket.
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
    await page.routeWebSocket('**/api/socket**', ws => ws.close());
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

    // Positive control: without this, a page that rendered nothing would pass.
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('div.relative.w-screen')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByTestId('connection-status')).toHaveCount(0, {
      timeout: 15000,
    });
  });
});
