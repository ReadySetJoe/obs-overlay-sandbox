import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { wheelId } = req.query;

  if (!wheelId || typeof wheelId !== 'string') {
    return res.status(400).json({ error: 'wheelId is required' });
  }

  if (req.method === 'PUT') {
    // Update wheel
    const {
      name,
      segments,
      isActive,
      position,
      scale,
      spinDuration,
      soundEnabled,
      soundVolume,
    } = req.body;

    try {
      // If setting this wheel to active, deactivate all other wheels for this layout
      if (isActive) {
        const wheel = await prisma.wheelConfig.findUnique({
          where: { id: wheelId },
        });

        if (wheel) {
          await prisma.wheelConfig.updateMany({
            where: {
              layoutId: wheel.layoutId,
              id: { not: wheelId },
            },
            data: { isActive: false },
          });
        }
      }

      const updateData: {
        name?: string;
        segments?: string;
        isActive?: boolean;
        position?: string;
        scale?: number;
        spinDuration?: number;
        soundEnabled?: boolean;
        soundVolume?: number;
      } = {};
      if (name !== undefined) updateData.name = name;
      if (segments !== undefined)
        updateData.segments = JSON.stringify(segments);
      if (isActive !== undefined) updateData.isActive = isActive;
      if (position !== undefined) updateData.position = position;
      if (scale !== undefined) updateData.scale = scale;
      if (spinDuration !== undefined) updateData.spinDuration = spinDuration;
      if (soundEnabled !== undefined) updateData.soundEnabled = soundEnabled;
      if (soundVolume !== undefined) updateData.soundVolume = soundVolume;

      const wheel = await prisma.wheelConfig.update({
        where: { id: wheelId },
        data: updateData,
      });

      return res.status(200).json({
        wheel: {
          ...wheel,
          segments: JSON.parse(wheel.segments),
        },
      });
    } catch (error) {
      console.error('Error updating wheel:', error);
      return res.status(500).json({ error: 'Failed to update wheel' });
    }
  } else if (req.method === 'DELETE') {
    // Delete wheel
    try {
      await prisma.wheelConfig.delete({
        where: { id: wheelId },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting wheel:', error);
      return res.status(500).json({ error: 'Failed to delete wheel' });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
