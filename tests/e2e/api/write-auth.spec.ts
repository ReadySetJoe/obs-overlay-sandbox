import { test, expect } from '@playwright/test';
import {
  setupTestDatabase,
  teardownTestDatabase,
} from '../../fixtures/database';
import { TEST_SESSION_ID } from '../../fixtures/auth';

/**
 * Endpoints that mutate a layout's configuration.
 *
 * None of these are reachable from an OBS browser source - overlay pages only
 * ever read (/api/wheels/list, /api/layouts/load, ...). So every one of them
 * must require an authenticated owner, rather than treating the sessionId in
 * the request body as a bearer capability. A sessionId appears in every OBS
 * URL and is routinely shared with moderators.
 */
const WRITE_ENDPOINTS = [
  {
    name: 'POST /api/wheels/create',
    method: 'post' as const,
    url: '/api/wheels/create',
    data: {
      sessionId: TEST_SESSION_ID,
      name: 'Unauthorized Wheel',
      segments: [{ label: 'a', color: '#ff0000' }],
    },
  },
  {
    name: 'PUT /api/wheels/[wheelId]',
    method: 'put' as const,
    url: '/api/wheels/some-wheel-id',
    data: { sessionId: TEST_SESSION_ID, name: 'Renamed' },
  },
  {
    name: 'DELETE /api/wheels/[wheelId]',
    method: 'delete' as const,
    url: '/api/wheels/some-wheel-id',
    data: { sessionId: TEST_SESSION_ID },
  },
  {
    name: 'POST /api/alerts/save',
    method: 'post' as const,
    url: '/api/alerts/save',
    data: { sessionId: TEST_SESSION_ID, eventType: 'follow' },
  },
  {
    name: 'POST /api/tts/save',
    method: 'post' as const,
    url: '/api/tts/save',
    data: { sessionId: TEST_SESSION_ID },
  },
  {
    name: 'POST /api/event-labels/reset',
    method: 'post' as const,
    url: '/api/event-labels/reset',
    data: { sessionId: TEST_SESSION_ID },
  },
  {
    name: 'POST /api/event-labels/test',
    method: 'post' as const,
    url: '/api/event-labels/test',
    data: { sessionId: TEST_SESSION_ID, eventType: 'follower' },
  },
  {
    name: 'POST /api/layouts/save',
    method: 'post' as const,
    url: '/api/layouts/save',
    data: { sessionId: TEST_SESSION_ID, colorScheme: 'ocean' },
  },
];

test.describe('layout write endpoints reject unauthenticated callers', () => {
  test.beforeAll(async () => {
    await setupTestDatabase();
  });

  test.afterAll(async () => {
    await teardownTestDatabase();
  });

  for (const endpoint of WRITE_ENDPOINTS) {
    test(`${endpoint.name} returns 401 without a session`, async ({
      request,
    }) => {
      // No cookies are set, so this is an anonymous caller who merely knows a
      // sessionId - exactly the situation a leaked OBS URL creates.
      const response = await request[endpoint.method](endpoint.url, {
        data: endpoint.data,
        failOnStatusCode: false,
      });

      expect(
        response.status(),
        `${endpoint.name} must not accept anonymous writes`
      ).toBe(401);
    });
  }
});

/**
 * Authentication alone is not sufficient. sessionId arrives in the request
 * body, so without an ownership comparison any signed-in user could modify
 * somebody else's layout just by knowing their sessionId.
 */
test.describe('layout write endpoints reject non-owners', () => {
  const OTHER_EMAIL = 'other-user@example.com';
  const OTHER_TOKEN = 'other-user-session-token';

  test.beforeAll(async () => {
    await setupTestDatabase();

    // A second, fully signed-in user who does NOT own TEST_SESSION_ID.
    const { prisma } = await import('@/lib/prisma');
    const other = await prisma.user.upsert({
      where: { email: OTHER_EMAIL },
      update: {},
      create: { name: 'Other User', email: OTHER_EMAIL },
    });
    await prisma.session.upsert({
      where: { sessionToken: OTHER_TOKEN },
      update: {
        userId: other.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        sessionToken: OTHER_TOKEN,
        userId: other.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  });

  test.afterAll(async () => {
    const { prisma } = await import('@/lib/prisma');
    await prisma.session.deleteMany({ where: { sessionToken: OTHER_TOKEN } });
    await prisma.user.deleteMany({ where: { email: OTHER_EMAIL } });
    await teardownTestDatabase();
  });

  for (const endpoint of WRITE_ENDPOINTS) {
    // wheels/[wheelId] resolves ownership via the wheel, which does not exist
    // here, so it correctly answers 404 rather than 403.
    const expected = endpoint.url.startsWith('/api/wheels/some-wheel-id')
      ? 404
      : 403;

    test(`${endpoint.name} returns ${expected} for a signed-in non-owner`, async ({
      request,
    }) => {
      const response = await request[endpoint.method](endpoint.url, {
        data: endpoint.data,
        headers: { Cookie: `next-auth.session-token=${OTHER_TOKEN}` },
        failOnStatusCode: false,
      });

      expect(
        response.status(),
        `${endpoint.name} must not let a non-owner write`
      ).toBe(expected);
    });
  }
});
