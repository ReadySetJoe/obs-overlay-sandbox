import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID, TEST_SESSION_TOKEN } from '../../fixtures/auth';
import { connectTestSocket } from '../../utils/socket-client';
import type { Socket } from 'socket.io-client';

/**
 * Both stream-stats routes reached for `global.io`, which nothing in the
 * codebase ever assigns - every other route uses getSocketServer(). So `io`
 * was always undefined, the `if (io)` guard silently skipped, and the overlay
 * was never told that stats had changed. The database updated correctly and
 * the screen never moved, which is indistinguishable from "the feature does
 * nothing".
 *
 * reset is the vehicle here rather than sync-twitch because it exercises the
 * identical emit path without needing a linked Twitch account or a live token.
 */
test.describe('stream stats socket broadcast', () => {
  let socket: Socket;

  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  test.afterEach(() => {
    socket?.disconnect();
  });

  test('reset broadcasts stream-stats-update to the session room', async ({
    request,
  }) => {
    // Connecting first also initialises the lazy Socket.io server, so
    // getSocketServer() has something to return by the time the route runs.
    socket = await connectTestSocket(TEST_SESSION_ID);

    const received = new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              'No stream-stats-update arrived within 10s - the route updated the database but never broadcast.'
            )
          ),
        10000
      );
      socket.once('stream-stats-update', (data: Record<string, unknown>) => {
        clearTimeout(timer);
        resolve(data);
      });
    });

    const response = await request.post('/api/stream-stats/reset', {
      data: { sessionId: TEST_SESSION_ID },
      headers: { Cookie: `next-auth.session-token=${TEST_SESSION_TOKEN}` },
      failOnStatusCode: false,
    });

    expect(response.status(), await response.text()).toBe(200);

    // The assertion that matters: the HTTP call succeeding proves the write,
    // not the broadcast. Before the fix this await timed out.
    const stats = await received;
    expect(stats).toHaveProperty('currentFollowers', 0);
    expect(stats).toHaveProperty('streamStartTime');
  });
});
