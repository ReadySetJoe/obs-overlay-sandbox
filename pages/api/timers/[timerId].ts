// pages/api/timers/[timerId].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { timerId } = req.query;

  if (!timerId || typeof timerId !== 'string') {
    return res.status(400).json({ error: 'Timer ID is required' });
  }

  try {
    // Verify timer ownership through layout
    const timer = await prisma.countdownTimer.findUnique({
      where: { id: timerId },
      include: { layout: true },
    });

    if (!timer) {
      return res.status(404).json({ error: 'Timer not found' });
    }

    if (timer.layout.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (req.method === 'PATCH') {
      const { title, description, targetDate, isActive } = req.body;

      const updatedTimer = await prisma.countdownTimer.update({
        where: { id: timerId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(targetDate !== undefined && {
            targetDate: new Date(targetDate),
          }),
          ...(isActive !== undefined && { isActive }),
        },
      });

      return res.status(200).json({ timer: updatedTimer });
    } else if (req.method === 'DELETE') {
      await prisma.countdownTimer.delete({
        where: { id: timerId },
      });

      return res.status(200).json({ success: true });
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error managing timer:', error);
    return res.status(500).json({ error: 'Failed to manage timer' });
  }
}
