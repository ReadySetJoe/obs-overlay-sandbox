import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  try {
    // Get layout to verify it exists
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
      include: {
        wheels: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Parse segments JSON for each wheel
    const wheels = layout.wheels.map((wheel) => ({
      ...wheel,
      segments: JSON.parse(wheel.segments),
    }));

    return res.status(200).json({ wheels });
  } catch (error) {
    console.error('Error fetching wheels:', error);
    return res.status(500).json({ error: 'Failed to fetch wheels' });
  }
}
