import { prisma } from '@/lib/prisma';
import { TEST_USER, TEST_SESSION_ID, TEST_SESSION_TOKEN } from './auth';

/**
 * Clean up test data from database
 */
export async function cleanupTestData() {
  try {
    // Delete test session's related data
    await prisma.wheelConfig.deleteMany({
      where: {
        layout: {
          sessionId: TEST_SESSION_ID,
        },
      },
    });

    await prisma.countdownTimer.deleteMany({
      where: {
        layout: {
          sessionId: TEST_SESSION_ID,
        },
      },
    });

    await prisma.alertConfig.deleteMany({
      where: {
        layout: {
          sessionId: TEST_SESSION_ID,
        },
      },
    });

    await prisma.tTSConfig.deleteMany({
      where: {
        layout: {
          sessionId: TEST_SESSION_ID,
        },
      },
    });

    await prisma.layout.deleteMany({
      where: {
        sessionId: TEST_SESSION_ID,
      },
    });

    // Clean up test user and their accounts/sessions
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email! },
    });

    if (existingUser) {
      await prisma.account.deleteMany({
        where: { userId: existingUser.id },
      });

      await prisma.session.deleteMany({
        where: { userId: existingUser.id },
      });

      await prisma.user.delete({
        where: { id: existingUser.id },
      });
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

/**
 * Create test user and session in database
 */
export async function seedTestUser() {
  try {
    // Create test user using email as unique identifier
    const user = await prisma.user.upsert({
      where: {
        email: TEST_USER.email!,
      },
      update: {
        name: TEST_USER.name,
        image: TEST_USER.image,
      },
      create: {
        name: TEST_USER.name,
        email: TEST_USER.email,
        image: TEST_USER.image,
      },
    });

    // Create Twitch account for the user (simulating OAuth)
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'twitch',
          providerAccountId: TEST_USER.twitchId,
        },
      },
      update: {
        userId: user.id,
      },
      create: {
        userId: user.id,
        type: 'oauth',
        provider: 'twitch',
        providerAccountId: TEST_USER.twitchId,
        access_token: 'test-access-token',
        token_type: 'bearer',
        scope: 'user:read:email',
      },
    });

    // Create a real NextAuth session row so getServerSession() resolves the
    // cookie set in setupAuthenticatedSession(). Without this, API routes see
    // an anonymous caller.
    await prisma.session.upsert({
      where: { sessionToken: TEST_SESSION_TOKEN },
      update: {
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      create: {
        sessionToken: TEST_SESSION_TOKEN,
        userId: user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // Create test layout/session
    await prisma.layout.upsert({
      where: {
        sessionId: TEST_SESSION_ID,
      },
      update: {
        userId: user.id,
        name: 'Test Layout',
      },
      create: {
        sessionId: TEST_SESSION_ID,
        userId: user.id,
        name: 'Test Layout',
      },
    });

    return user;
  } catch (error) {
    console.error('Error seeding test user:', error);
    throw error;
  }
}

/**
 * Setup database for tests
 */
export async function setupTestDatabase() {
  await cleanupTestData();
  await seedTestUser();
}

/**
 * Teardown database after tests
 */
export async function teardownTestDatabase() {
  await cleanupTestData();
}
