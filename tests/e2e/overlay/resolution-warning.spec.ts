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
