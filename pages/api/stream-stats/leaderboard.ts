// pages/api/stream-stats/leaderboard.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, type = 'nicest', limit = 10 } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    let chatters;

    if (type === 'nicest') {
      // Get nicest chatters (highest average sentiment)
      chatters = await prisma.chatter.findMany({
        where: {
          sessionId,
          messageCount: { gte: 5 }, // Minimum 5 messages to qualify
        },
        orderBy: { averageSentiment: 'desc' },
        take: parseInt(limit as string),
        select: {
          username: true,
          displayName: true,
          messageCount: true,
          averageSentiment: true,
          positiveMessages: true,
          negativeMessages: true,
          neutralMessages: true,
        },
      });
    } else if (type === 'most-active') {
      // Get most active chatters
      chatters = await prisma.chatter.findMany({
        where: { sessionId },
        orderBy: { messageCount: 'desc' },
        take: parseInt(limit as string),
        select: {
          username: true,
          displayName: true,
          messageCount: true,
          averageSentiment: true,
        },
      });
    } else {
      return res.status(400).json({ error: 'Invalid type parameter' });
    }

    res.status(200).json({ chatters });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
}
