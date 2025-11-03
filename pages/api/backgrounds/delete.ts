// pages/api/backgrounds/delete.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { getSocketServer } from '../socket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Verify user owns this layout
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout || layout.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete from Cloudinary if exists
    if (layout.backgroundImagePublicId) {
      try {
        await deleteFromCloudinary(layout.backgroundImagePublicId);
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', error);
        // Continue anyway - clean up database even if Cloudinary fails
      }
    }

    // Update database - clear all background fields
    await prisma.layout.update({
      where: { sessionId },
      data: {
        backgroundImageUrl: null,
        backgroundImagePublicId: null,
        backgroundImageName: null,
        backgroundColors: null,
        backgroundOpacity: 1.0,
        backgroundBlur: 0,
        backgroundUploadedAt: null,
      },
    });

    // Emit socket event to remove background from overlays
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('background-change', {
        backgroundImageUrl: null,
        backgroundOpacity: 1.0,
        backgroundBlur: 0,
      });
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Delete error:', error);
    res.status(500).json({
      error: 'Failed to delete background',
      message: error.message,
    });
  }
}
