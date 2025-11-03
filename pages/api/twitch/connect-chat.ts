// pages/api/twitch/connect-chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { startTwitchChatMonitoring } from '@/lib/twitchChat';
import { startFollowMonitoring } from '@/lib/twitchFollows';
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

    // Start follow monitoring (if access token is available)
    if (session.accessToken) {
      await startFollowMonitoring(
        twitchUsername,
        session.accessToken,
        sessionId,
        io
      );
    } else {
      console.warn('No access token available for follow monitoring');
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
