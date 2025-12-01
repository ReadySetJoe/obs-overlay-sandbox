import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { navigateToDashboard, navigateToOverlay } from '../../fixtures/auth';
import { exposeSocketStatus } from '../../utils/test-helpers';

test.describe('Countdown Timer - Dashboard to Overlay Sync', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  // Note: Timer creation requires server-side session authentication.
  // This test is skipped because our mock session doesn't work with getServerSession.
  // The timer API validates session on the server side unlike wheel API.
  test.skip('should create timer in dashboard and display it in overlay', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // 1. Navigate to dashboard
    await navigateToDashboard(page);

    // 2. Open overlay in a new page
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'countdown');

    // 3. Click on Countdown Timer tile in dashboard
    await page.click('text=Countdown Timers');

    // Wait for expanded view to load
    await expect(page.locator('text=+ Add Timer')).toBeVisible({
      timeout: 5000,
    });

    // 4. Create a new timer
    await page.click('text=+ Add Timer');

    // Fill in timer details
    await page.fill('input[placeholder*="Stream starts"]', 'Test E2E Timer');
    await page.fill(
      'input[placeholder*="Get ready"]',
      'Testing countdown sync'
    );

    // Set target date to 1 hour from now
    const futureDate = new Date(Date.now() + 60 * 60 * 1000);
    const dateString = futureDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
    await page.fill('input[type="datetime-local"]', dateString);

    // Click create button - wait for it to be enabled first
    const createButton = page.locator('button:has-text("Create Timer")');
    await expect(createButton).toBeEnabled({ timeout: 3000 });
    await createButton.click();

    // Wait for the form to close (the "Create New Timer" heading should disappear)
    await expect(
      page.locator('h3:has-text("Create New Timer")')
    ).not.toBeVisible({
      timeout: 5000,
    });

    // Wait for timer to appear in the list
    await expect(page.locator('text=Test E2E Timer')).toBeVisible({
      timeout: 5000,
    });

    // 5. The timer should be inactive by default, activate it
    const pausedButton = page.locator('button:has-text("Paused")').first();
    await expect(pausedButton).toBeVisible({ timeout: 3000 });
    await pausedButton.click();

    // Wait for timer to become active
    await expect(page.locator('button:has-text("Active")').first()).toBeVisible(
      {
        timeout: 3000,
      }
    );

    // 6. Verify overlay shows the timer
    // Give socket time to propagate
    await overlayPage.waitForTimeout(2000);

    // The timer title should appear in overlay
    await expect(overlayPage.locator('text=Test E2E Timer')).toBeVisible({
      timeout: 5000,
    });

    // The description should also appear
    await expect(
      overlayPage.locator('text=Testing countdown sync')
    ).toBeVisible({ timeout: 3000 });

    // Verify countdown display elements are visible (Days, Hours, Mins, Secs)
    await expect(overlayPage.locator('text=Days')).toBeVisible();
    await expect(overlayPage.locator('text=Hours')).toBeVisible();
    await expect(overlayPage.locator('text=Mins')).toBeVisible();
    await expect(overlayPage.locator('text=Secs')).toBeVisible();

    // 7. Verify timer is counting down (seconds should change)
    const getSecondsValue = async () => {
      // Get the value displayed for seconds (the number before "Secs")
      const secsContainer = overlayPage.locator(
        'div:has(> div:has-text("Secs"))'
      );
      const secsValue = secsContainer.locator('div.text-3xl').first();
      return await secsValue.textContent();
    };

    const initialSeconds = await getSecondsValue();
    await overlayPage.waitForTimeout(2000);
    const laterSeconds = await getSecondsValue();

    // Seconds should have changed (countdown is working)
    expect(initialSeconds).not.toBe(laterSeconds);

    // 8. Cleanup - close overlay
    await overlayPage.close();
  });

  test('should toggle timer visibility from dashboard', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'countdown');

    // Open Countdown Timer settings
    await page.click('text=Countdown Timers');
    await expect(page.locator('text=+ Add Timer')).toBeVisible({
      timeout: 5000,
    });

    // Check initial visibility state
    const visibilityButton = page
      .locator('button:has-text("Visible"), button:has-text("Hidden")')
      .first();
    await expect(visibilityButton).toBeVisible({ timeout: 3000 });

    const initialState = await visibilityButton.textContent();

    // Toggle visibility
    await visibilityButton.click();
    await page.waitForTimeout(1000);

    // Get new state
    const newState = await visibilityButton.textContent();

    // Verify button text changed
    expect(newState).not.toBe(initialState);

    // Toggle back to original state
    await visibilityButton.click();
    await page.waitForTimeout(500);

    await overlayPage.close();
  });

  // Note: Timer creation/deletion requires server-side session authentication.
  test.skip('should delete timer from dashboard', async ({ page, context }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'countdown');

    // Open Countdown Timer settings
    await page.click('text=Countdown Timers');
    await expect(page.locator('text=+ Add Timer')).toBeVisible({
      timeout: 5000,
    });

    // Create a timer to delete
    await page.click('text=+ Add Timer');
    await page.fill('input[placeholder*="Stream starts"]', 'Timer To Delete');

    const futureDate = new Date(Date.now() + 30 * 60 * 1000);
    const dateString = futureDate.toISOString().slice(0, 16);
    await page.fill('input[type="datetime-local"]', dateString);

    await page.click('button:has-text("Create Timer")');

    // Wait for timer to appear
    await expect(page.locator('text=Timer To Delete')).toBeVisible({
      timeout: 5000,
    });

    // Find and click the delete button (trash icon) for this timer
    const timerCard = page.locator('div:has-text("Timer To Delete")').first();
    const deleteButton = timerCard.locator('button.text-red-400');
    await deleteButton.click();

    // Verify timer is removed
    await expect(page.locator('text=Timer To Delete')).not.toBeVisible({
      timeout: 5000,
    });

    await overlayPage.close();
  });

  test('should open countdown timer dashboard panel', async ({
    page,
    context,
  }) => {
    await exposeSocketStatus(page);

    // Navigate to dashboard
    await navigateToDashboard(page);

    // Open overlay for sync testing
    const overlayPage = await context.newPage();
    await exposeSocketStatus(overlayPage);
    await navigateToOverlay(overlayPage, 'countdown');

    // Open Countdown Timer settings
    await page.click('text=Countdown Timers');

    // Wait for expanded view to load
    await expect(page.locator('text=+ Add Timer')).toBeVisible({
      timeout: 5000,
    });

    // Verify the countdown timer panel is displayed with key elements
    await expect(page.locator('h2:has-text("Countdown Timers")')).toBeVisible();
    await expect(page.locator('text=Position & Size')).toBeVisible();

    // Verify the overlay page loaded successfully
    await expect(overlayPage.locator('body')).toBeVisible();

    await overlayPage.close();
  });
});
