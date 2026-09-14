// pages/api/twitch/connect-chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { startTwitchChatMonitoring } from '@/lib/twitchChat';
import { startFollowMonitoring } from '@/lib/twitchFollows';
import { getValidTwitchToken } from '@/lib/twitchToken';
import { Server as SocketIOServer } from 'socket.io';

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: {
      io?: SocketIOServer;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  const twitchUsername = session.user.name;

  if (!twitchUsername) {
    return res.status(400).json({ error: 'Twitch username not found' });
  }

  // Get the socket.io instance
  const io = res.socket.server.io;

  if (!io) {
    return res.status(500).json({ error: 'Socket.io not initialized' });
  }

  try {
    // Start chat monitoring (for messages, subs, bits, raids, etc.)
    await startTwitchChatMonitoring(twitchUsername, sessionId, io);

    // Start follow monitoring.
    //
    // The Twitch access token has to come from the Account row, not from
    // session.accessToken. NextAuth is configured with the Prisma adapter,
    // which means database sessions - so the `jwt` callback in
    // pages/api/auth/[...nextauth].ts never runs and session.accessToken is
    // always undefined. This branch was therefore dead, and follower/event
    // label updates silently never started.
    //
    // getValidTwitchToken refreshes an expired token first. Chat itself is
    // anonymous, so a dead token only costs follow monitoring - which is
    // exactly the kind of half-working state that is hard to notice.
    const token = await getValidTwitchToken(session.user.id);

    if (token.ok) {
      await startFollowMonitoring(
        twitchUsername,
        token.accessToken,
        sessionId,
        io
      );
    } else {
      console.warn(`Skipping follow monitoring: ${token.error}`);
    }

    return res.status(200).json({
      success: true,
      message: `Monitoring Twitch events for ${twitchUsername}`,
    });
  } catch (error) {
    console.error('Error starting Twitch monitoring:', error);
    return res.status(500).json({ error: 'Failed to connect to Twitch' });
  }
}
