// pages/api/stream-stats/reset.ts
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
    // Reset stream stats data
    const emptyStats = {
      currentFollowers: 0,
      currentSubs: 0,
      currentBits: 0,
      totalMessages: 0,
      uniqueChatters: 0,
      messagesPerMinute: 0,
      mostActiveChatterCount: 0,
      overallPositivityScore: 0,
      nicestChatterScore: 0,
      streamStartTime: new Date().toISOString(),
    };

    await prisma.layout.update({
      where: { sessionId },
      data: {
        streamStatsData: JSON.stringify(emptyStats),
      },
    });

    // Delete all chatter records for this session
    await prisma.chatter.deleteMany({
      where: { sessionId },
    });

    // Emit reset event via socket.io
    const io = (
      global as {
        io?: {
          to: (room: string) => {
            emit: (event: string, data: unknown) => void;
          };
        };
      }
    ).io;
    if (io) {
      io.to(sessionId).emit('stream-stats-update', emptyStats);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error resetting stream stats:', error);
    res.status(500).json({ error: 'Failed to reset stream stats' });
  }
}
