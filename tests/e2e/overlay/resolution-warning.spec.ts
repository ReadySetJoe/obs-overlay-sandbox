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

  test('auto-hides after its visible window', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/overlay/${TEST_SESSION_ID}/weather`);

    await expect(page.getByTestId('resolution-warning')).toBeVisible({
      timeout: 10000,
    });

    // VISIBLE_MS is 10s; generous headroom for the auto-retrying assertion.
    await expect(page.getByTestId('resolution-warning')).toHaveCount(0, {
      timeout: 15000,
    });
  });

  test('does not warn again for the same size after a reload', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/overlay/${TEST_SESSION_ID}/weather`);
    await expect(page.getByTestId('resolution-warning')).toBeVisible({
      timeout: 10000,
    });

    await page.reload();
    await expect(page.locator('div.relative.w-screen')).toBeVisible({
      timeout: 15000,
    });

    await expect(page.getByTestId('resolution-warning')).toHaveCount(0);
  });

  test('warns again when the source changes to a different wrong size', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`/overlay/${TEST_SESSION_ID}/weather`);

    // A key is written for 1280x720 here - that is what makes the second
    // warning below a real test of the size component of the storage key.
    await expect(page.getByText(/1280×720/)).toBeVisible({ timeout: 10000 });

    await page.setViewportSize({ width: 800, height: 600 });

    // With a pathname-only key this suppresses and the banner still reads
    // 1280x720, so this assertion is what proves the size is in the key.
    await expect(page.getByText(/800×600/)).toBeVisible({ timeout: 10000 });
  });
});
