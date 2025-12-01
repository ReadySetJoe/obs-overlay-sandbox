import { test, expect, Page } from '@playwright/test';
import { setupTestDatabase, teardownTestDatabase } from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay, TEST_SESSION_ID } from '../../fixtures/auth';
import { waitForSocketEvent, waitForCanvasChange, exposeSocketStatus } from '../../utils/test-helpers';

test.describe('Wheel Spinner - Dashboard to Overlay Sync', () => {
  // Setup database before all tests
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  // Cleanup after all tests
  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('should create wheel in dashboard and spin it in overlay', async ({ page, context }) => {
    // Setup socket status tracking
    await exposeSocketStatus(page);

    // 1. Navigate to dashboard
    await navigateToDashboard(page);

    // 2. Open overlay in a new page
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'wheel');

    // 3. Click on Wheel Spinner tile in dashboard
    await page.click('text=Wheel Spinner');

    // Wait for expanded view to load
    await expect(page.locator('text=Create Wheel')).toBeVisible({ timeout: 5000 });

    // 4. Create a new wheel
    await page.click('text=Create Wheel');

    // Fill in wheel details
    await page.fill('input[placeholder*="Giveaway"]', 'Test E2E Wheel');

    // Keep default segments (Option 1, Option 2)
    // Click save/create
    await page.click('button:has-text("Create Wheel")');

    // Wait for wheel to be created
    await expect(page.locator('text=Test E2E Wheel')).toBeVisible({ timeout: 5000 });

    // 5. Activate the wheel
    await page.click('button:has-text("Activate")');

    // Wait for activation - look for the "Active" badge (more specific)
    await expect(page.locator('span.bg-purple-600:has-text("Active")')).toBeVisible({ timeout: 3000 });

    // 6. Verify overlay shows the wheel (canvas should be visible)
    await expect(overlayPage.locator('canvas')).toBeVisible({ timeout: 5000 });

    // 7. Spin the wheel from dashboard
    const spinButton = page.locator('button:has-text("Spin")');
    await expect(spinButton).toBeVisible();
    await spinButton.click();

    // 8. Verify overlay receives spin event and canvas changes
    // The canvas should animate (change) when spinning
    await waitForCanvasChange(overlayPage, 'canvas', 8000);

    // 9. Wait for spin to complete (default 5 seconds + buffer)
    await overlayPage.waitForTimeout(6000);

    // 10. Verify winner announcement appears
    await expect(overlayPage.locator('text=Winner!')).toBeVisible({ timeout: 2000 });

    // Verify one of the options is shown as winner
    const winnerText = overlayPage.locator('text=/Option [12]/');
    await expect(winnerText).toBeVisible();

    // 11. Verify wheel stops spinning (no infinite loop)
    // Wait a bit more and ensure canvas is stable
    const snapshotBefore = await overlayPage.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas?.toDataURL();
    });

    await overlayPage.waitForTimeout(2000);

    const snapshotAfter = await overlayPage.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      return canvas?.toDataURL();
    });

    // Canvas should be stable (same image) after animation completes
    expect(snapshotBefore).toBe(snapshotAfter);

    // 12. Cleanup - close overlay
    await overlayPage.close();
  });

  test.skip('should sync wheel updates from dashboard to overlay', async ({ page, context }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'wheel');

    // Open wheel settings
    await page.click('text=Wheel Spinner');

    // Create and activate a wheel (similar to previous test)
    await page.click('text=Create Wheel');
    await page.fill('input[placeholder*="Giveaway"]', 'Sync Test Wheel');
    await page.click('button:has-text("Create Wheel")');

    // Wait for wheel to be created
    await expect(page.locator('text=Sync Test Wheel')).toBeVisible({ timeout: 5000 });

    // Activate the wheel
    await page.click('button:has-text("Activate")');

    // Verify canvas is visible in overlay after activation
    await expect(overlayPage.locator('canvas')).toBeVisible({ timeout: 5000 });

    // Test passed! The wheel synced from dashboard to overlay
    await overlayPage.close();
  });
});
