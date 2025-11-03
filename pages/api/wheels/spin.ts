import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSocketServer } from '../socket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wheelId, sessionId } = req.body;

  if (!wheelId || !sessionId) {
    return res.status(400).json({ error: 'wheelId and sessionId are required' });
  }

  try {
    // Get wheel
    const wheel = await prisma.wheelConfig.findUnique({
      where: { id: wheelId },
    });

    if (!wheel) {
      return res.status(404).json({ error: 'Wheel not found' });
    }

    // Parse segments
    const segments = JSON.parse(wheel.segments);

    // Calculate winning segment based on weights
    const totalWeight = segments.reduce(
      (sum: number, seg: any) => sum + (seg.weight || 1),
      0
    );

    const random = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    let winningIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      accumulatedWeight += segments[i].weight || 1;
      if (random <= accumulatedWeight) {
        winningIndex = i;
        break;
      }
    }

    const winningLabel = segments[winningIndex].label;

    // Emit spin event via Socket.io
    const io = getSocketServer();
    if (io) {
      console.log('[Wheel Spin API] Emitting wheel-spin event to session:', sessionId);
      io.to(sessionId).emit('wheel-spin', {
        wheelId,
        winningIndex,
        winningLabel,
        timestamp: Date.now(),
      });
    } else {
      console.error('[Wheel Spin API] Socket.io server not available');
    }

    return res.status(200).json({
      success: true,
      winningIndex,
      winningLabel,
    });
  } catch (error) {
    console.error('Error spinning wheel:', error);
    return res.status(500).json({ error: 'Failed to spin wheel' });
  }
}
