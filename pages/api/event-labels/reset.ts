// pages/api/event-labels/reset.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Missing sessionId' });
  }

  try {
    // Get socket server
    const io = (
      res.socket as unknown as {
        server: {
          io?: {
            to: (room: string) => {
              emit: (event: string, data: unknown) => void;
            };
          };
        };
      }
    )?.server?.io;
    if (!io) {
      return res
        .status(500)
        .json({ error: 'Socket server not initialized. Please refresh.' });
    }

    // Get current layout
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Clear event labels data
    const emptyEventLabelsData = {};

    // Update database
    await prisma.layout.update({
      where: { sessionId },
      data: {
        eventLabelsData: JSON.stringify(emptyEventLabelsData),
      },
    });

    // Emit socket event to clear overlay
    io.to(sessionId).emit('event-labels-update', emptyEventLabelsData);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error resetting event labels:', error);
    return res.status(500).json({ error: 'Failed to reset event labels' });
  }
}
