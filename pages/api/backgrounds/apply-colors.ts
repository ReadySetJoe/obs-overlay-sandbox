// pages/api/backgrounds/apply-colors.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { getSocketServer } from '../socket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId, primary, secondary, accent } = req.body;

    if (!sessionId || !primary || !secondary || !accent) {
      return res.status(400).json({
        error: 'Session ID and color values (primary, secondary, accent) are required',
      });
    }

    // Verify user owns this layout
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout || layout.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Create custom colors object
    const customColors = {
      primary,
      secondary,
      accent,
      gradientType: 'linear' as const,
      gradientDirection: 'to-br' as const,
    };

    // Update layout with custom colors and set color scheme to 'custom'
    await prisma.layout.update({
      where: { sessionId },
      data: {
        colorScheme: 'custom',
        customColors: JSON.stringify(customColors),
      },
    });

    // Emit socket events to update overlays
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('color-scheme-change', 'custom');
      io.to(sessionId).emit('custom-colors-change', customColors);
    }

    res.status(200).json({
      success: true,
      customColors,
    });
  } catch (error: any) {
    console.error('Apply colors error:', error);
    res.status(500).json({
      error: 'Failed to apply colors',
      message: error.message,
    });
  }
}
