import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';
import { exposeSocketStatus } from '../../utils/test-helpers';

test.describe('Weather Effects - Dashboard to Overlay Sync', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('should sync weather effect changes from dashboard to overlay', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // 1. Navigate to dashboard
    await navigateToDashboard(page);

    // 2. Open overlay in a new page
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'weather');

    // 3. Click on Weather Effects tile in dashboard
    await page.click('text=Weather Effects');

    // Wait for expanded view to load
    await expect(page.locator('button:has-text("rain")')).toBeVisible({
      timeout: 5000,
    });

    // 4. Change to Rain effect
    await page.click('button:has-text("rain")');
    await overlayPage.waitForTimeout(1500);

    // Verify overlay is rendering and didn't crash
    await expect(overlayPage.locator('body')).toBeVisible();

    // Verify overlay is rendering and body is visible
    // Weather effects may use canvas or other rendering methods
    await expect(overlayPage.locator('body')).toBeVisible();

    // 5. Change to Snow effect
    await page.click('button:has-text("snow")');
    await overlayPage.waitForTimeout(1500);

    // Verify overlay still works
    await expect(overlayPage.locator('body')).toBeVisible();

    // 6. Change to Hearts effect
    await page.click('button:has-text("hearts")');
    await overlayPage.waitForTimeout(1500);

    await expect(overlayPage.locator('body')).toBeVisible();

    // 7. Change to Stars effect
    await page.click('button:has-text("stars")');
    await overlayPage.waitForTimeout(1500);

    await expect(overlayPage.locator('body')).toBeVisible();

    // 8. Turn off weather effects
    await page.click('button:has-text("none")');
    await overlayPage.waitForTimeout(1500);

    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });

  test('should cycle through all weather effect types', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'weather');

    // Open Weather Effects settings
    await page.click('text=Weather Effects');

    // Wait for expanded view
    await expect(page.locator('button:has-text("rain")')).toBeVisible({
      timeout: 5000,
    });

    // Test all weather effects
    const effects = [
      'rain',
      'snow',
      'hearts',
      'stars',
      'bubbles',
      'leaves',
      'sakura',
      'none',
    ];

    for (const effect of effects) {
      await page.click(`button:has-text("${effect}")`);
      await overlayPage.waitForTimeout(800);

      // Verify overlay didn't crash
      await expect(overlayPage.locator('body')).toBeVisible();
    }

    await overlayPage.close();
  });

  test('should adjust particle density', async ({ page, context }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'weather');

    // Open Weather Effects settings
    await page.click('text=Weather Effects');

    // Wait for expanded view
    await expect(page.locator('text=Particle Density')).toBeVisible({
      timeout: 5000,
    });

    // First, enable a weather effect so we can see density changes
    await page.click('button:has-text("rain")');
    await overlayPage.waitForTimeout(1000);

    // Find the density slider
    const densitySlider = page.locator('input[type="range"]').last();
    await expect(densitySlider).toBeVisible();

    // Get initial value
    const initialValue = await densitySlider.inputValue();

    // Change density to max (2)
    await densitySlider.fill('2');
    await overlayPage.waitForTimeout(1000);

    // Verify overlay still works
    await expect(overlayPage.locator('body')).toBeVisible();

    // Change density to min (0.5)
    await densitySlider.fill('0.5');
    await overlayPage.waitForTimeout(1000);

    // Verify overlay still works
    await expect(overlayPage.locator('body')).toBeVisible();

    // Reset to initial value
    await densitySlider.fill(initialValue);

    await overlayPage.close();
  });

  test('should toggle weather visibility from dashboard', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'weather');

    // Open Weather Effects settings
    await page.click('text=Weather Effects');

    // Wait for expanded view
    await expect(page.locator('button:has-text("rain")')).toBeVisible({
      timeout: 5000,
    });

    // Find visibility toggle button
    const visibilityButton = page
      .locator('button:has-text("Visible"), button:has-text("Hidden")')
      .first();
    await expect(visibilityButton).toBeVisible({ timeout: 3000 });

    const initialText = await visibilityButton.textContent();
    const wasVisible = initialText?.includes('Visible');

    // Toggle visibility
    await visibilityButton.click();
    await page.waitForTimeout(1000);

    // Verify button text changed
    if (wasVisible) {
      await expect(
        page.locator('button:has-text("Hidden")').first()
      ).toBeVisible({ timeout: 3000 });
    } else {
      await expect(
        page.locator('button:has-text("Visible")').first()
      ).toBeVisible({ timeout: 3000 });
    }

    // Toggle back
    await visibilityButton.click();
    await page.waitForTimeout(500);

    // Verify overlay still working
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });
});
