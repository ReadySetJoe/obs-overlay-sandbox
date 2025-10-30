// pages/api/timers/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Get layout first to verify ownership
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
      include: {
        countdowns: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    if (layout.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.status(200).json({ timers: layout.countdowns });
  } catch (error) {
    console.error('Error fetching timers:', error);
    return res.status(500).json({ error: 'Failed to fetch timers' });
  }
}
