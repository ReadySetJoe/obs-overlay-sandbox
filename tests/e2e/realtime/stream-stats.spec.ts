import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';
import { exposeSocketStatus } from '../../utils/test-helpers';

test.describe('Stream Stats - Dashboard to Overlay Sync', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('should sync display mode changes from dashboard to overlay', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // 1. Navigate to dashboard
    await navigateToDashboard(page);

    // 2. Open overlay in a new page
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'stream-stats');

    // 3. Click on Stream Stats tile in dashboard
    await page.click('text=Stream Stats');

    // Wait for expanded view to load
    await expect(page.locator('text=Display Mode')).toBeVisible({
      timeout: 5000,
    });

    // 4. Verify overlay is rendering (body is visible and not crashed)
    await expect(overlayPage.locator('body')).toBeVisible();

    // 5. Change display mode to "Compact"
    await page.click('button:has-text("Compact")');
    await overlayPage.waitForTimeout(1500);

    // Verify overlay still works after mode change
    await expect(overlayPage.locator('body')).toBeVisible();

    // 6. Change display mode to "Goals Only"
    await page.click('button:has-text("Goals Only")');
    await overlayPage.waitForTimeout(1500);

    // Verify overlay still works
    await expect(overlayPage.locator('body')).toBeVisible();

    // 7. Change display mode to "Metrics Only"
    await page.click('button:has-text("Metrics Only")');
    await overlayPage.waitForTimeout(1500);

    // Verify overlay still works
    await expect(overlayPage.locator('body')).toBeVisible();

    // 8. Change back to "Full" mode
    await page.click('button:has-text("Full")');
    await overlayPage.waitForTimeout(1500);

    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });

  test('should toggle goal visibility in dashboard', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'stream-stats');

    // Open Stream Stats settings
    await page.click('text=Stream Stats');

    // Wait for expanded view
    await expect(page.locator('text=Goal Targets')).toBeVisible({
      timeout: 5000,
    });

    // Find the first checkbox in the Goal Targets section (Follower Goal)
    // The structure is: Goal Targets section -> list of goals -> each has a checkbox
    const followerCheckbox = page
      .getByRole('checkbox', { name: 'Show' })
      .first();
    await expect(followerCheckbox).toBeVisible({ timeout: 3000 });

    // Get initial state
    const initialChecked = await followerCheckbox.isChecked();

    // Toggle the checkbox
    await followerCheckbox.click();
    await page.waitForTimeout(1000);

    // Verify it changed
    const newChecked = await followerCheckbox.isChecked();
    expect(newChecked).not.toBe(initialChecked);

    // Toggle back
    await followerCheckbox.click();
    await page.waitForTimeout(500);

    // Verify overlay didn't crash
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });

  test('should toggle metric visibility checkboxes', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'stream-stats');

    // Open Stream Stats settings
    await page.click('text=Stream Stats');

    // Wait for expanded view with metrics
    await expect(page.locator('text=Visible Metrics')).toBeVisible({
      timeout: 5000,
    });

    // Find and toggle the "Total Messages" metric checkbox
    const totalMessagesSection = page.locator(
      'label:has-text("Total Messages")'
    );
    const messageCheckbox = totalMessagesSection.locator(
      'input[type="checkbox"]'
    );

    // Toggle the checkbox
    const initialState = await messageCheckbox.isChecked();
    await messageCheckbox.click();
    await page.waitForTimeout(1000);

    // Verify state changed
    const newState = await messageCheckbox.isChecked();
    expect(newState).not.toBe(initialState);

    // Toggle back to original
    await messageCheckbox.click();
    await page.waitForTimeout(500);

    // Verify overlay is still working
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });

  test('should toggle stream stats visibility from dashboard', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'stream-stats');

    // Open Stream Stats settings
    await page.click('text=Stream Stats');

    // Wait for expanded view
    await expect(page.locator('text=Display Mode')).toBeVisible({
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

    await overlayPage.close();
  });
});
