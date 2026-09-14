import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID, TEST_SESSION_TOKEN } from '../../fixtures/auth';

/**
 * sync-twitch used to treat a rejected Twitch request as a real zero.
 *
 * Both fetches were `if (response.ok) { ... }` with no else, so a 401 left the
 * count at 0 and the endpoint returned HTTP 200. The dashboard then alerted
 * "Successfully synced! Followers: 0 Subscribers: 0" - a success message for a
 * request Twitch refused.
 *
 * Worse, the counts were assigned unconditionally afterwards, so a transient
 * failure or an expired token *overwrote* previously-good stored values with 0
 * and persisted that.
 *
 * No mocking is needed to exercise this: tests/fixtures/database.ts seeds the
 * Twitch Account with a fake access_token, so every real call to Twitch 401s.
 */
test.describe('sync-twitch failure handling', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test('reports failure instead of reporting zeros as success', async ({
    request,
  }) => {
    const response = await request.post('/api/stream-stats/sync-twitch', {
      data: { sessionId: TEST_SESSION_ID },
      headers: { Cookie: `next-auth.session-token=${TEST_SESSION_TOKEN}` },
      failOnStatusCode: false,
    });

    const body = await response.text();

    // The seeded token is fake, so Twitch rejects both calls. Claiming success
    // here is the bug.
    expect(
      response.status(),
      `expected a failure status, got ${response.status()} with body ${body}`
    ).not.toBe(200);

    expect(body).toMatch(/twitch/i);
  });

  test('does not overwrite stored counts when Twitch rejects the request', async ({
    request,
  }) => {
    const { prisma } = await import('@/lib/prisma');

    // Seed a known-good follower count, as if an earlier sync had succeeded.
    await prisma.layout.update({
      where: { sessionId: TEST_SESSION_ID },
      data: {
        streamStatsData: JSON.stringify({
          currentFollowers: 1234,
          currentSubs: 56,
          currentBits: 0,
          totalMessages: 0,
          uniqueChatters: 0,
          messagesPerMinute: 0,
          mostActiveChatterCount: 0,
          overallPositivityScore: 0,
          nicestChatterScore: 0,
        }),
      },
    });

    await request.post('/api/stream-stats/sync-twitch', {
      data: { sessionId: TEST_SESSION_ID },
      headers: { Cookie: `next-auth.session-token=${TEST_SESSION_TOKEN}` },
      failOnStatusCode: false,
    });

    const after = await prisma.layout.findUnique({
      where: { sessionId: TEST_SESSION_ID },
      select: { streamStatsData: true },
    });
    const stats = JSON.parse(after?.streamStatsData ?? '{}');

    // A failed sync must leave the last known-good values alone rather than
    // persisting 0 over them.
    expect(stats.currentFollowers).toBe(1234);
    expect(stats.currentSubs).toBe(56);
  });
});
