// pages/api/twitch/disconnect-chat.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { stopTwitchChatMonitoring } from '@/lib/twitchChat';
import { stopFollowMonitoring } from '@/lib/twitchFollows';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
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

  try {
    // Stop chat monitoring
    await stopTwitchChatMonitoring(sessionId);

    // Stop follow monitoring
    await stopFollowMonitoring(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Stopped monitoring Twitch events',
    });
  } catch (error) {
    console.error('Error stopping Twitch monitoring:', error);
    return res.status(500).json({ error: 'Failed to disconnect from Twitch' });
  }
}
