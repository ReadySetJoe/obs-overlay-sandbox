// pages/api/layouts/save.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

interface LayerVisibility {
  id: string;
  visible: boolean;
}

interface LayoutData {
  sessionId: string;
  colorScheme?: string;
  customColors?: string;
  fontFamily?: string;
  weatherEffect?: string;
  layers?: LayerVisibility[];
  componentLayouts?: string;
  paintByNumbersState?: string;
  streamStatsConfig?: string;
}

interface LayerVisibilityFields {
  weatherVisible?: boolean;
  chatVisible?: boolean;
  nowPlayingVisible?: boolean;
  countdownVisible?: boolean;
  chatHighlightVisible?: boolean;
  paintByNumbersVisible?: boolean;
  eventLabelsVisible?: boolean;
  streamStatsVisible?: boolean;
  wheelVisible?: boolean;
}

interface LayoutFields {
  colorScheme: string;
  customColors: string | null;
  fontFamily: string;
  weatherEffect: string;
  componentLayouts: string | null;
  paintByNumbersState: string | null;
  streamStatsConfig: string | null;
}

// For updates - all layout fields are optional
type UpdateData = Partial<LayoutFields> & LayerVisibilityFields;

// For creation - layout fields are required, plus userId and sessionId
type CreateData = LayoutFields &
  LayerVisibilityFields & {
    userId: string;
    sessionId: string;
  };

// Default values for various fields
const DEFAULTS = {
  colorScheme: 'default',
  fontFamily: 'Inter',
  weatherEffect: 'none',
} as const;

// Layer ID mappings for visibility
const LAYER_VISIBILITY_MAP = {
  weather: 'weatherVisible',
  chat: 'chatVisible',
  nowplaying: 'nowPlayingVisible',
  countdown: 'countdownVisible',
  chathighlight: 'chatHighlightVisible',
  paintbynumbers: 'paintByNumbersVisible',
  eventlabels: 'eventLabelsVisible',
  streamstats: 'streamStatsVisible',
  wheel: 'wheelVisible',
} as const;

function buildUpdateData(data: LayoutData): UpdateData {
  const updateData: UpdateData = {};

  // Handle optional string/config fields
  if (data.colorScheme !== undefined) {
    updateData.colorScheme = data.colorScheme;
  }
  if (data.customColors !== undefined) {
    updateData.customColors = data.customColors || null;
  }
  if (data.fontFamily !== undefined) {
    updateData.fontFamily = data.fontFamily || DEFAULTS.fontFamily;
  }
  if (data.weatherEffect !== undefined) {
    updateData.weatherEffect = data.weatherEffect;
  }
  if (data.componentLayouts !== undefined) {
    updateData.componentLayouts = data.componentLayouts || null;
  }
  if (data.paintByNumbersState !== undefined) {
    updateData.paintByNumbersState = data.paintByNumbersState || null;
  }
  if (data.streamStatsConfig !== undefined) {
    updateData.streamStatsConfig = data.streamStatsConfig || null;
  }

  // Handle layer visibility
  if (data.layers && Array.isArray(data.layers)) {
    const layerMap = new Map(
      data.layers.map(layer => [layer.id, layer.visible])
    );

    Object.entries(LAYER_VISIBILITY_MAP).forEach(([layerId, visibilityKey]) => {
      if (layerMap.has(layerId)) {
        const visible = layerMap.get(layerId);
        if (visible !== undefined) {
          (updateData as Record<string, boolean>)[visibilityKey] = visible;
        }
      }
    });
  }

  return updateData;
}

function buildCreateData(data: LayoutData, userId: string): CreateData {
  const layerMap = data.layers
    ? new Map(data.layers.map(layer => [layer.id, layer.visible]))
    : new Map();

  return {
    userId,
    sessionId: data.sessionId,
    colorScheme: data.colorScheme || DEFAULTS.colorScheme,
    customColors: data.customColors || null,
    fontFamily: data.fontFamily || DEFAULTS.fontFamily,
    weatherEffect: data.weatherEffect || DEFAULTS.weatherEffect,
    componentLayouts: data.componentLayouts || null,
    paintByNumbersState: data.paintByNumbersState || null,
    streamStatsConfig: data.streamStatsConfig || null,
    weatherVisible: layerMap.get('weather'),
    chatVisible: layerMap.get('chat'),
    nowPlayingVisible: layerMap.get('nowplaying'),
    countdownVisible: layerMap.get('countdown'),
    chatHighlightVisible: layerMap.get('chathighlight'),
    paintByNumbersVisible: layerMap.get('paintbynumbers'),
    eventLabelsVisible: layerMap.get('eventlabels'),
    streamStatsVisible: layerMap.get('streamstats'),
    wheelVisible: layerMap.get('wheel'),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const data: LayoutData = req.body;

  try {
    const updateData = buildUpdateData(data);

    const layout = await prisma.layout.upsert({
      where: { sessionId: data.sessionId },
      update: updateData,
      create: buildCreateData(data, session.user.id),
    });

    return res.status(200).json({ success: true, layout });
  } catch (error) {
    console.error('Error saving layout:', error);
    return res.status(500).json({ error: 'Failed to save layout' });
  }
}
