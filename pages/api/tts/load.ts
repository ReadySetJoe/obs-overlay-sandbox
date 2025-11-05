// pages/api/tts/load.ts
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
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Find the layout by sessionId
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
      include: { ttsConfig: true },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    return res.status(200).json({
      ttsConfig: layout.ttsConfig,
      ttsVisible: layout.ttsVisible
    });
  } catch (error) {
    console.error('Error loading TTS config:', error);
    return res.status(500).json({ error: 'Failed to load TTS config' });
  }
}
