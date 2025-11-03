// pages/api/stream-stats/sync-twitch.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // Get the user's Twitch account info from NextAuth
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'twitch',
      },
    });

    if (!account?.access_token || !account?.providerAccountId) {
      return res.status(400).json({
        error: 'Twitch account not connected',
      });
    }

    const broadcasterId = account.providerAccountId;
    const accessToken = account.access_token;

    // Fetch follower count from Twitch API
    const followersResponse = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
        },
      }
    );

    let followerCount = 0;
    if (followersResponse.ok) {
      const followersData = await followersResponse.json();
      followerCount = followersData.total || 0;
    }

    // Fetch subscriber count from Twitch API
    // Note: This requires channel:read:subscriptions scope and affiliate/partner status
    let subCount = 0;
    try {
      const subsResponse = await fetch(
        `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broadcasterId}&first=1`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID!,
          },
        }
      );

      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        // The total is in the response, but pagination is needed for exact count
        // For simplicity, we'll use the 'total' field if available
        subCount = subsData.total || 0;
      }
    } catch (error) {
      console.log('Could not fetch subscriber count (requires affiliate/partner status)');
    }

    // Load existing streamStatsData
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    let statsData: any = {
      currentFollowers: 0,
      currentSubs: 0,
      currentBits: 0,
      totalMessages: 0,
      uniqueChatters: 0,
      messagesPerMinute: 0,
      mostActiveChatterCount: 0,
      overallPositivityScore: 0,
      nicestChatterScore: 0,
    };

    // Parse existing data to preserve chat metrics
    if (layout.streamStatsData) {
      try {
        statsData = JSON.parse(layout.streamStatsData);
      } catch (error) {
        console.error('Error parsing stream stats data:', error);
      }
    }

    // Update with Twitch stats
    statsData.currentFollowers = followerCount;
    statsData.currentSubs = subCount;
    // Keep currentBits as is (running total from cheers)

    // Save to database
    await prisma.layout.update({
      where: { sessionId },
      data: {
        streamStatsData: JSON.stringify(statsData),
      },
    });

    // Emit update via socket.io
    const io = (global as any).io;
    if (io) {
      io.to(sessionId).emit('stream-stats-update', statsData);
    }

    res.status(200).json({
      success: true,
      followers: followerCount,
      subscribers: subCount,
    });
  } catch (error) {
    console.error('Error syncing Twitch stats:', error);
    res.status(500).json({ error: 'Failed to sync Twitch stats' });
  }
}
