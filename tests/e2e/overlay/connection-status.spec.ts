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
