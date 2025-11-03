// pages/api/alerts/save.ts
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
    eventType,
    enabled,
    imageUrl,
    imagePublicId,
    animationType,
    duration,
    position,
    soundUrl,
    soundPublicId,
    volume,
    messageTemplate,
    fontSize,
    textColor,
    textShadow,
  } = req.body;

  if (!sessionId || !eventType) {
    return res
      .status(400)
      .json({ error: 'Session ID and event type are required' });
  }

  try {
    // Find the layout by sessionId
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Upsert the alert config
    const alertConfig = await prisma.alertConfig.upsert({
      where: {
        layoutId_eventType: {
          layoutId: layout.id,
          eventType,
        },
      },
      update: {
        enabled,
        imageUrl,
        imagePublicId,
        animationType,
        duration,
        position,
        soundUrl,
        soundPublicId,
        volume,
        messageTemplate,
        fontSize,
        textColor,
        textShadow,
      },
      create: {
        layoutId: layout.id,
        eventType,
        enabled,
        imageUrl,
        imagePublicId,
        animationType,
        duration,
        position,
        soundUrl,
        soundPublicId,
        volume,
        messageTemplate,
        fontSize,
        textColor,
        textShadow,
      },
    });

    return res.status(200).json({ alertConfig });
  } catch (error) {
    console.error('Error saving alert config:', error);
    return res.status(500).json({ error: 'Failed to save alert config' });
  }
}
