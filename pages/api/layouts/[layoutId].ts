// pages/api/layouts/[layoutId].ts
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

  const { layoutId } = req.query;

  if (typeof layoutId !== 'string') {
    return res.status(400).json({ error: 'Invalid layout ID' });
  }

  if (req.method === 'DELETE') {
    try {
      // Verify the layout belongs to the user
      const layout = await prisma.layout.findUnique({
        where: { id: layoutId },
      });

      if (!layout) {
        return res.status(404).json({ error: 'Layout not found' });
      }

      if (layout.userId !== session.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Delete the layout (cascades to countdowns, alerts, wheels)
      await prisma.layout.delete({
        where: { id: layoutId },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting layout:', error);
      return res.status(500).json({ error: 'Failed to delete layout' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
