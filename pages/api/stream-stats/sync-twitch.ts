// pages/api/stream-stats/sync-twitch.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { getSocketServer } from '../socket';
import { getValidTwitchToken } from '@/lib/twitchToken';

interface StreamStatsData {
  currentFollowers: number;
  currentSubs: number;
  currentBits: number;
  totalMessages: number;
  uniqueChatters: number;
  messagesPerMinute: number;
  mostActiveChatterCount: number;
  overallPositivityScore: number;
  nicestChatterScore: number;
}

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
    // Refreshes the stored token when it has expired. Reading
    // account.access_token directly is what made this endpoint stop working
    // a few hours after every sign-in.
    const token = await getValidTwitchToken(session.user.id);

    if (!token.ok) {
      return res.status(token.status).json({ error: token.error });
    }

    const { accessToken, broadcasterId } = token;

    // Fetch follower count from Twitch API
    const followersResponse = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': process.env.TWITCH_CLIENT_ID!,
        },
      }
    );

    // null means "Twitch did not tell us", which is different from zero.
    let followerCount: number | null = null;
    let followerError: string | null = null;

    if (followersResponse.ok) {
      const followersData = await followersResponse.json();
      followerCount = followersData.total || 0;
    } else {
      followerError = `followers: Twitch returned ${followersResponse.status}`;
    }

    // Fetch subscriber count from Twitch API
    // Note: This requires channel:read:subscriptions scope and affiliate/partner status
    let subCount: number | null = null;
    let subError: string | null = null;

    try {
      const subsResponse = await fetch(
        `https://api.twitch.tv/helix/subscriptions?broadcaster_id=${broadcasterId}&first=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID!,
          },
        }
      );

      if (subsResponse.ok) {
        const subsData = await subsResponse.json();
        // The total is in the response, but pagination is needed for exact count
        // For simplicity, we'll use the 'total' field if available
        subCount = subsData.total || 0;
      } else {
        subError =
          `subscribers: Twitch returned ${subsResponse.status} ` +
          '(needs the channel:read:subscriptions scope and affiliate/partner status)';
      }
    } catch (error) {
      subError = 'subscribers: request failed';
      console.error('Error fetching subscriber count', error);
    }

    // If Twitch refused everything, say so rather than persisting zeros over
    // good data and reporting success. Expiry is already handled above, so
    // reaching here means Twitch rejected a token it should have accepted -
    // usually a revoked authorisation.
    if (followerCount === null && subCount === null) {
      return res.status(502).json({
        error:
          `Twitch rejected both requests (${followerError}; ${subError}). ` +
          'If this persists, sign out and sign in again to re-authorise.',
      });
    }

    // Load existing streamStatsData
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    let statsData: StreamStatsData = {
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
        const parsedData = JSON.parse(
          layout.streamStatsData
        ) as Partial<StreamStatsData>;
        statsData = { ...statsData, ...parsedData };
      } catch (error) {
        console.error('Error parsing stream stats data:', error);
      }
    }

    // Only overwrite what Twitch actually returned. Assigning unconditionally
    // meant a rejected request persisted 0 over the last known-good value.
    if (followerCount !== null) {
      statsData.currentFollowers = followerCount;
    }
    if (subCount !== null) {
      statsData.currentSubs = subCount;
    }
    // Keep currentBits as is (running total from cheers)

    // Save to database
    await prisma.layout.update({
      where: { sessionId },
      data: {
        streamStatsData: JSON.stringify(statsData),
      },
    });

    // Emit update via socket.io
    // Previously `global.io`, which nothing in the codebase assigns, so this
    // broadcast never fired and the overlay kept showing stale stats.
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('stream-stats-update', statsData);
    }

    const warnings = [followerError, subError].filter(Boolean);

    res.status(200).json({
      success: true,
      followers: statsData.currentFollowers,
      subscribers: statsData.currentSubs,
      warnings,
    });
  } catch (error) {
    console.error('Error syncing Twitch stats:', error);
    res.status(500).json({ error: 'Failed to sync Twitch stats' });
  }
}
