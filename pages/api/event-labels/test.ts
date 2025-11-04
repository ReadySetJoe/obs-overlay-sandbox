// pages/api/event-labels/test.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

const TEST_NAMES = [
  'CoolViewer123',
  'StreamFan',
  'GamerPro',
  'NightOwl',
  'ChillDude',
  'EpicPlayer',
  'SupportSquad',
  'AwesomeFan',
];

function getRandomName() {
  return TEST_NAMES[Math.floor(Math.random() * TEST_NAMES.length)];
}

function getRandomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, eventType } = req.body;

  if (!sessionId || !eventType) {
    return res.status(400).json({ error: 'Missing sessionId or eventType' });
  }

  try {
    // Get socket server
    const io = (
      res.socket as unknown as {
        server: {
          io?: {
            to: (room: string) => {
              emit: (event: string, data: unknown) => void;
            };
          };
        };
      }
    )?.server?.io;
    if (!io) {
      return res
        .status(500)
        .json({ error: 'Socket server not initialized. Please refresh.' });
    }

    // Get current layout
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) {
      return res.status(404).json({ error: 'Layout not found' });
    }

    // Parse existing event labels data
    let eventLabelsData = {};
    if (layout.eventLabelsData) {
      try {
        eventLabelsData = JSON.parse(layout.eventLabelsData);
      } catch (error) {
        console.error('Error parsing event labels data:', error);
      }
    }

    // Generate test data based on event type
    let updates = {};
    switch (eventType) {
      case 'follower':
        updates = { latestFollower: getRandomName() };
        break;
      case 'sub':
        updates = { latestSub: getRandomName() };
        break;
      case 'bits':
        updates = {
          latestBits: {
            username: getRandomName(),
            amount: getRandomNumber(100, 5000),
          },
        };
        break;
      case 'raid':
        updates = {
          latestRaid: {
            username: getRandomName(),
            count: getRandomNumber(5, 100),
          },
        };
        break;
      case 'giftsub':
        updates = { latestGiftSub: { gifter: getRandomName() } };
        break;
      default:
        return res.status(400).json({ error: 'Invalid event type' });
    }

    // Merge with existing data
    const updatedEventLabelsData = { ...eventLabelsData, ...updates };

    // Update database
    await prisma.layout.update({
      where: { sessionId },
      data: {
        eventLabelsData: JSON.stringify(updatedEventLabelsData),
      },
    });

    // Emit socket event
    io.to(sessionId).emit('event-labels-update', updatedEventLabelsData);

    return res
      .status(200)
      .json({ success: true, data: updatedEventLabelsData });
  } catch (error) {
    console.error('Error triggering test event:', error);
    return res.status(500).json({ error: 'Failed to trigger test event' });
  }
}
