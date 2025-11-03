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

  const { sessionId, colorScheme, customColors, weatherEffect, layers, componentLayouts, paintByNumbersState } =
    req.body;

  try {
    const layout = await prisma.layout.upsert({
      where: { sessionId },
      update: {
        colorScheme,
        customColors: customColors || null,
        weatherEffect,
        weatherVisible: layers.find((l: any) => l.id === 'weather')?.visible,
        chatVisible: layers.find((l: any) => l.id === 'chat')?.visible,
        nowPlayingVisible: layers.find((l: any) => l.id === 'nowplaying')
          ?.visible,
        countdownVisible: layers.find((l: any) => l.id === 'countdown')
          ?.visible,
        chatHighlightVisible: layers.find((l: any) => l.id === 'chathighlight')
          ?.visible,
        paintByNumbersVisible:
          layers.find((l: any) => l.id === 'paintbynumbers')?.visible,
        componentLayouts: componentLayouts || null,
        paintByNumbersState: paintByNumbersState || null,
      },
      create: {
        userId: session.user.id,
        sessionId,
        colorScheme,
        customColors: customColors || null,
        weatherEffect,
        weatherVisible: layers.find((l: any) => l.id === 'weather')?.visible ?? true,
        chatVisible: layers.find((l: any) => l.id === 'chat')?.visible ?? true,
        nowPlayingVisible: layers.find((l: any) => l.id === 'nowplaying')
          ?.visible ?? true,
        countdownVisible: layers.find((l: any) => l.id === 'countdown')
          ?.visible ?? true,
        chatHighlightVisible: layers.find((l: any) => l.id === 'chathighlight')
          ?.visible ?? true,
        paintByNumbersVisible:
          layers.find((l: any) => l.id === 'paintbynumbers')?.visible ?? true,
        componentLayouts: componentLayouts || null,
        paintByNumbersState: paintByNumbersState || null,
      },
    });

    return res.status(200).json({ success: true, layout });
  } catch (error) {
    console.error('Error saving layout:', error);
    return res.status(500).json({ error: 'Failed to save layout' });
  }
}
