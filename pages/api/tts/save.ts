// pages/api/tts/save.ts
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
    voice,
    rate,
    pitch,
    volume,
    maxQueueSize,
    showVisualizer,
    visualizerPosition,
    visualizerStyle,
    backgroundColor,
    textColor,
    filterProfanity,
    allowedSources,
    position,
    scale,
    x,
    y,
  } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }

  try {
    // Find the layout by sessionId
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Upsert the TTS config (one config per layout)
    const ttsConfig = await prisma.tTSConfig.upsert({
      where: {
        layoutId: layout.id,
      },
      update: {
        voice,
        rate,
        pitch,
        volume,
        maxQueueSize,
        showVisualizer,
        visualizerPosition,
        visualizerStyle,
        backgroundColor,
        textColor,
        filterProfanity,
        allowedSources,
        position,
        scale,
        x,
        y,
      },
      create: {
        layoutId: layout.id,
        voice,
        rate,
        pitch,
        volume,
        maxQueueSize,
        showVisualizer,
        visualizerPosition,
        visualizerStyle,
        backgroundColor,
        textColor,
        filterProfanity,
        allowedSources,
        position,
        scale,
        x,
        y,
      },
    });

    return res.status(200).json({ ttsConfig });
  } catch (error) {
    console.error('Error saving TTS config:', error);
    return res.status(500).json({ error: 'Failed to save TTS config' });
  }
}
