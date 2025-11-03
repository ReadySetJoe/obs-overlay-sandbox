// pages/api/layouts/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    sessionId,
    colorScheme,
    customColors,
    fontFamily,
    weatherEffect,
    layers,
    componentLayouts,
    paintByNumbersState,
    streamStatsConfig,
  } = req.body;

  try {
    // Build update object dynamically to handle partial updates
    const updateData: any = {};

    if (colorScheme !== undefined) updateData.colorScheme = colorScheme;
    if (customColors !== undefined) updateData.customColors = customColors || null;
    if (fontFamily !== undefined) updateData.fontFamily = fontFamily || 'Inter';
    if (weatherEffect !== undefined) updateData.weatherEffect = weatherEffect;
    if (componentLayouts !== undefined) updateData.componentLayouts = componentLayouts || null;
    if (paintByNumbersState !== undefined) updateData.paintByNumbersState = paintByNumbersState || null;
    if (streamStatsConfig !== undefined) updateData.streamStatsConfig = streamStatsConfig || null;

    // Only update visibility if layers array is provided
    if (layers && Array.isArray(layers)) {
      updateData.weatherVisible = layers.find((l: any) => l.id === 'weather')?.visible;
      updateData.chatVisible = layers.find((l: any) => l.id === 'chat')?.visible;
      updateData.nowPlayingVisible = layers.find((l: any) => l.id === 'nowplaying')?.visible;
      updateData.countdownVisible = layers.find((l: any) => l.id === 'countdown')?.visible;
      updateData.chatHighlightVisible = layers.find((l: any) => l.id === 'chathighlight')?.visible;
      updateData.paintByNumbersVisible = layers.find((l: any) => l.id === 'paintbynumbers')?.visible;
      updateData.eventLabelsVisible = layers.find((l: any) => l.id === 'eventlabels')?.visible;
      updateData.streamStatsVisible = layers.find((l: any) => l.id === 'streamstats')?.visible;
      updateData.wheelVisible = layers.find((l: any) => l.id === 'wheel')?.visible;
    }

    const layout = await prisma.layout.upsert({
      where: { sessionId },
      update: updateData,
      create: {
        userId: session.user.id,
        sessionId,
        colorScheme: colorScheme || 'default',
        customColors: customColors || null,
        fontFamily: fontFamily || 'Inter',
        weatherEffect: weatherEffect || 'none',
        weatherVisible:
          layers?.find((l: any) => l.id === 'weather')?.visible ?? true,
        chatVisible: layers?.find((l: any) => l.id === 'chat')?.visible ?? true,
        nowPlayingVisible:
          layers?.find((l: any) => l.id === 'nowplaying')?.visible ?? true,
        countdownVisible:
          layers?.find((l: any) => l.id === 'countdown')?.visible ?? true,
        chatHighlightVisible:
          layers?.find((l: any) => l.id === 'chathighlight')?.visible ?? true,
        paintByNumbersVisible:
          layers?.find((l: any) => l.id === 'paintbynumbers')?.visible ?? true,
        eventLabelsVisible:
          layers?.find((l: any) => l.id === 'eventlabels')?.visible ?? true,
        streamStatsVisible:
          layers?.find((l: any) => l.id === 'streamstats')?.visible ?? true,
        wheelVisible:
          layers?.find((l: any) => l.id === 'wheel')?.visible ?? true,
        componentLayouts: componentLayouts || null,
        paintByNumbersState: paintByNumbersState || null,
        streamStatsConfig: streamStatsConfig || null,
      },
    });

    return res.status(200).json({ success: true, layout });
  } catch (error) {
    console.error('Error saving layout:', error);
    return res.status(500).json({ error: 'Failed to save layout' });
  }
}
