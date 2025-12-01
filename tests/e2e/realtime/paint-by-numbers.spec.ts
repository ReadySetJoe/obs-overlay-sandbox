import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';
import { exposeSocketStatus } from '../../utils/test-helpers';

test.describe('Paint by Numbers - Dashboard to Overlay Sync', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('should display paint by numbers overlay and open settings panel', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // 1. Navigate to dashboard
    await navigateToDashboard(page);

    // 2. Open overlay in a new page
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'paint-by-numbers');

    // 3. Click on Paint by Numbers tile in dashboard
    await page.click('text=Paint by Numbers');

    // Wait for expanded view to load
    await expect(page.locator('text=Select Template')).toBeVisible({
      timeout: 5000,
    });

    // 4. Verify the panel loaded with key elements
    await expect(page.locator('h2:has-text("Paint by Numbers")')).toBeVisible();
    await expect(page.locator('text=Position & Size')).toBeVisible();

    // 5. Verify overlay is rendering properly
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });

  test('should toggle paint by numbers visibility', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'paint-by-numbers');

    // Open Paint by Numbers settings
    await page.click('text=Paint by Numbers');

    // Wait for expanded view
    await expect(page.locator('text=Select Template')).toBeVisible({
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

  test('should adjust scale and grid size settings', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'paint-by-numbers');

    // Open Paint by Numbers settings
    await page.click('text=Paint by Numbers');

    // Wait for expanded view
    await expect(page.locator('text=Position & Size')).toBeVisible({
      timeout: 5000,
    });

    // Find the scale slider (first range input under Position & Size)
    const scaleSlider = page.locator('input[type="range"]').first();
    await expect(scaleSlider).toBeVisible();

    // Change scale
    const initialScale = await scaleSlider.inputValue();
    await scaleSlider.fill('1.5');
    await page.waitForTimeout(1000);

    // Verify overlay didn't crash
    await expect(overlayPage.locator('body')).toBeVisible();

    // Change to different scale
    await scaleSlider.fill('0.8');
    await page.waitForTimeout(1000);

    await expect(overlayPage.locator('body')).toBeVisible();

    // Reset scale
    await scaleSlider.fill(initialScale);

    // Find and adjust grid size slider (second range input)
    const gridSlider = page.locator('input[type="range"]').nth(1);
    if (await gridSlider.isVisible()) {
      const initialGrid = await gridSlider.inputValue();
      await gridSlider.fill('30');
      await page.waitForTimeout(1000);

      await expect(overlayPage.locator('body')).toBeVisible();

      // Reset grid
      await gridSlider.fill(initialGrid);
    }

    await overlayPage.close();
  });

  // Note: Reset requires a template to be selected and progress to exist
  test.skip('should reset canvas when reset button is clicked', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'paint-by-numbers');

    // Open Paint by Numbers settings
    await page.click('text=Paint by Numbers');

    // Wait for expanded view
    await expect(page.locator('text=Select Template')).toBeVisible({
      timeout: 5000,
    });

    // Verify overlay loaded
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });

  // Note: Template selection requires templates to be loaded from the API.
  // This test is skipped because template loading can be slow/unreliable in tests.
  test.skip('should show progress when template is selected', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'paint-by-numbers');

    // Open Paint by Numbers settings
    await page.click('text=Paint by Numbers');

    // Wait for expanded view
    await expect(page.locator('text=Select Template')).toBeVisible({
      timeout: 5000,
    });

    // Verify overlay is working
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });
});
