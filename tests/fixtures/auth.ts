import { Page } from '@playwright/test';

/**
 * Mock test user for authentication
 */
export const TEST_USER = {
  id: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  image: null, // No image to avoid next/image configuration issues
  twitchId: 'test-twitch-id',
  twitchUsername: 'test_streamer',
};

/**
 * Mock session for testing
 */
export const TEST_SESSION_ID = 'test-session-e2e';

/**
 * Setup authenticated session for tests
 * This mocks the NextAuth session without requiring real OAuth
 */
export async function setupAuthenticatedSession(page: Page) {
  // Mock the session API endpoint
  await page.route('**/api/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: TEST_USER,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }),
    });
  });

  // Mock the providers endpoint
  await page.route('**/api/auth/providers', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        twitch: {
          id: 'twitch',
          name: 'Twitch',
          type: 'oauth',
        },
      }),
    });
  });

  // Set authentication cookies
  await page.context().addCookies([
    {
      name: 'next-auth.session-token',
      value: 'test-session-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    },
  ]);
}

/**
 * Navigate to dashboard with authentication
 */
export async function navigateToDashboard(
  page: Page,
  sessionId: string = TEST_SESSION_ID
) {
  await setupAuthenticatedSession(page);
  await page.goto(`/dashboard/${sessionId}`, { waitUntil: 'networkidle' });

  // Wait for the dashboard to load - check for a known element
  // The dashboard should have the "Visual & Theming" section header
  await page.waitForSelector('text=Visual & Theming', {
    timeout: 15000,
  }).catch(() => {
    // Fallback: just wait for body to be visible
    return page.waitForSelector('body');
  });

  // Give socket time to connect
  await page.waitForTimeout(2000);
}

/**
 * Navigate to overlay page
 */
export async function navigateToOverlay(
  page: Page,
  overlayType: string,
  sessionId: string = TEST_SESSION_ID
) {
  await page.goto(`/overlay/${sessionId}/${overlayType}`);

  // Wait for socket connection in overlay
  await page.waitForTimeout(2000); // Give socket time to connect
}
