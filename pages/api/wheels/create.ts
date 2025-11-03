import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    sessionId,
    name,
    segments,
    position,
    scale,
    spinDuration,
    soundEnabled,
    soundVolume,
  } = req.body;

  if (!sessionId || !name || !segments || !Array.isArray(segments)) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate segments
  for (const segment of segments) {
    if (!segment.label || !segment.color) {
      return res.status(400).json({ error: 'Invalid segment data' });
    }
  }

  try {
    // Get layout
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Create wheel
    const wheel = await prisma.wheelConfig.create({
      data: {
        layoutId: layout.id,
        name,
        segments: JSON.stringify(segments),
        isActive: false,
        position: position || 'center',
        scale: scale || 1.0,
        spinDuration: spinDuration || 5,
        soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
        soundVolume: soundVolume !== undefined ? soundVolume : 0.7,
      },
    });

    return res.status(201).json({
      wheel: {
        ...wheel,
        segments: JSON.parse(wheel.segments),
      },
    });
  } catch (error) {
    console.error('Error creating wheel:', error);
    return res.status(500).json({ error: 'Failed to create wheel' });
  }
}
