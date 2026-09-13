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
 * NextAuth session token used by the tests.
 *
 * This is set as a cookie AND seeded as a Session row by seedTestUser(), so
 * that getServerSession() actually resolves server-side. Mocking
 * /api/auth/session with page.route only fools client-side code - it leaves
 * API routes unauthenticated, which silently hid the fact that write
 * endpoints had no auth at all.
 */
export const TEST_SESSION_TOKEN = 'test-session-token';

/**
 * Setup authenticated session for tests
 * This mocks the NextAuth session without requiring real OAuth
 */
export async function setupAuthenticatedSession(page: Page) {
  // Mock the session API endpoint
  await page.route('**/api/auth/session', async route => {
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
  await page.route('**/api/auth/providers', async route => {
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
      value: TEST_SESSION_TOKEN,
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

  // Wait for the tile grid, located by test id rather than by a section
  // heading. The previous version waited on "Visual & Theming" with a
  // .catch() fallback, which meant a stale selector cost every dashboard
  // test a silent 15s timeout instead of failing. No catch here on purpose:
  // if the grid stops appearing, these tests should say so.
  await page.getByTestId('dashboard-grid').waitFor({
    state: 'visible',
    timeout: 15000,
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
