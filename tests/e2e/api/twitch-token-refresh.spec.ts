import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import {
  TEST_SESSION_ID,
  TEST_SESSION_TOKEN,
  TEST_USER,
} from '../../fixtures/auth';

/**
 * Twitch user access tokens expire in a few hours. NextAuth stores
 * `refresh_token` and `expires_at` on the Account row at sign-in, but nothing
 * in the codebase ever read either field - every caller used `access_token`
 * raw, forever.
 *
 * So goals sync worked for an afternoon and then failed permanently, and the
 * only cure anyone could find was signing out and back in. That is the
 * systemic cause behind "goals sync from twitch is broken": the other fixes
 * make the failure visible, this one stops it happening.
 *
 * The seeded refresh_token is fake, so the refresh itself cannot succeed here.
 * What is provable without mocking is the decision: with a known-expired
 * token the route must attempt a refresh and report that re-authentication is
 * needed, rather than spending the dead token and blaming Twitch.
 */
test.describe('twitch token refresh', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('refuses to spend a known-expired token and asks for re-auth', async ({
    request,
  }) => {
    const { prisma } = await import('@/lib/prisma');

    // Mark the stored token as expired an hour ago, as it would be for any
    // user who signed in this morning.
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'twitch',
          providerAccountId: TEST_USER.twitchId,
        },
      },
      data: {
        refresh_token: 'test-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600,
      },
    });

    const response = await request.post('/api/stream-stats/sync-twitch', {
      data: { sessionId: TEST_SESSION_ID },
      headers: { Cookie: `next-auth.session-token=${TEST_SESSION_TOKEN}` },
      failOnStatusCode: false,
    });

    const body = await response.text();

    // 401, not 502: the problem is this app's stored credential, not Twitch
    // having an outage. The distinction is what tells the user what to do.
    expect(response.status(), body).toBe(401);
    expect(body).toMatch(/expired/i);
    expect(body).toMatch(/sign/i);

    // And it must not have tried the call anyway and pinned it on Twitch.
    expect(body).not.toMatch(/Twitch rejected both requests/);
  });

  test('still attempts the call when expiry is unknown', async ({
    request,
  }) => {
    const { prisma } = await import('@/lib/prisma');

    // Accounts created before expires_at was recorded have null. Treating
    // null as "expired" would lock those users out of a token that may well
    // be fine, so the route must try it and let Twitch decide.
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: 'twitch',
          providerAccountId: TEST_USER.twitchId,
        },
      },
      data: { refresh_token: null, expires_at: null },
    });

    const response = await request.post('/api/stream-stats/sync-twitch', {
      data: { sessionId: TEST_SESSION_ID },
      headers: { Cookie: `next-auth.session-token=${TEST_SESSION_TOKEN}` },
      failOnStatusCode: false,
    });

    const body = await response.text();

    expect(response.status(), body).not.toBe(401);
    expect(body).not.toMatch(/expired/i);
  });
});
