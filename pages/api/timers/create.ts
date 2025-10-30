// pages/api/timers/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

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

  const { sessionId, title, description, targetDate } = req.body;

  if (!sessionId || !title || !targetDate) {
    return res
      .status(400)
      .json({ error: 'Session ID, title, and target date are required' });
  }

  try {
    // Verify layout ownership
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    if (layout.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Create timer
    const timer = await prisma.countdownTimer.create({
      data: {
        layoutId: layout.id,
        title,
        description,
        targetDate: new Date(targetDate),
      },
    });

    return res.status(201).json({ timer });
  } catch (error) {
    console.error('Error creating timer:', error);
    return res.status(500).json({ error: 'Failed to create timer' });
  }
}
