// pages/api/layouts/load.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

/**
 * Public endpoint for loading layout data
 * No authentication required - accessible to OBS browser sources
 * Security: sessionId is a UUID that's difficult to guess
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    console.log('[API] Layout loaded for overlay:', sessionId);
    return res.status(200).json({ layout });
  } catch (error) {
    console.error('[API] Error loading layout:', error);
    return res.status(500).json({ error: 'Failed to load layout' });
  }
}
