import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, name } = req.body;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (name.trim().length === 0) {
    return res.status(400).json({ error: 'Name cannot be empty' });
  }

  if (name.length > 100) {
    return res.status(400).json({ error: 'Name must be 100 characters or less' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find the layout and verify ownership
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    if (layout.userId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Update the layout name
    const updatedLayout = await prisma.layout.update({
      where: { sessionId },
      data: { name: name.trim() },
    });

    return res.status(200).json({
      success: true,
      layout: {
        id: updatedLayout.id,
        sessionId: updatedLayout.sessionId,
        name: updatedLayout.name,
      },
    });
  } catch (error) {
    console.error('Error renaming layout:', error);
    return res.status(500).json({ error: 'Failed to rename layout' });
  }
}
