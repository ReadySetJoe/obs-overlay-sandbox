import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getSocketServer } from '../socket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Initialize socket server if not available
  const initSocketServer = async () => {
    let io = getSocketServer();
    if (!io) {
      console.log('[Wheel Spin API] Socket server not found, initializing...');
      try {
        // Hit the socket endpoint to initialize the server
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/socket`);
        // Wait a moment for initialization
        await new Promise(resolve => setTimeout(resolve, 100));
        io = getSocketServer();
        if (io) {
          console.log('[Wheel Spin API] Socket server initialized successfully');
        }
      } catch (error) {
        console.error('[Wheel Spin API] Failed to initialize socket server:', error);
      }
    }
    return io;
  };
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wheelId, sessionId } = req.body;

  if (!wheelId || !sessionId) {
    return res
      .status(400)
      .json({ error: 'wheelId and sessionId are required' });
  }

  try {
    console.log('[Wheel Spin API] Request received:', { wheelId, sessionId });

    // Get wheel
    const wheel = await prisma.wheelConfig.findUnique({
      where: { id: wheelId },
    });

    if (!wheel) {
      console.error('[Wheel Spin API] Wheel not found:', wheelId);
      return res.status(404).json({ error: 'Wheel not found' });
    }

    console.log('[Wheel Spin API] Wheel found:', {
      id: wheel.id,
      name: wheel.name,
      isActive: wheel.isActive,
    });

    // Parse segments
    const segments = JSON.parse(wheel.segments);
    console.log('[Wheel Spin API] Segments count:', segments.length);

    // Calculate winning segment based on weights
    const totalWeight = segments.reduce(
      (sum: number, seg: { weight?: number }) => sum + (seg.weight || 1),
      0
    );

    const random = Math.random() * totalWeight;
    let accumulatedWeight = 0;
    let winningIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      accumulatedWeight += segments[i].weight || 1;
      if (random <= accumulatedWeight) {
        winningIndex = i;
        break;
      }
    }

    const winningLabel = segments[winningIndex].label;
    console.log('[Wheel Spin API] Winner selected:', {
      winningIndex,
      winningLabel,
    });

    // Emit spin event via Socket.io
    const io = await initSocketServer();
    if (io) {
      const spinData = {
        wheelId,
        winningIndex,
        winningLabel,
        timestamp: Date.now(),
      };
      console.log(
        '[Wheel Spin API] Emitting wheel-spin event to session:',
        sessionId,
        'with data:',
        spinData
      );

      // Get the rooms to verify the session exists
      const rooms = await io.in(sessionId).fetchSockets();
      console.log(
        '[Wheel Spin API] Connected clients in session room:',
        rooms.length
      );

      io.to(sessionId).emit('wheel-spin', spinData);
      console.log('[Wheel Spin API] Event emitted successfully');
    } else {
      console.error('[Wheel Spin API] Socket.io server not available');
      console.error('[Wheel Spin API] Could not initialize socket server');
      return res.status(500).json({
        error: 'Socket server not available. Please refresh the page and try again.'
      });
    }

    return res.status(200).json({
      success: true,
      winningIndex,
      winningLabel,
    });
  } catch (error) {
    console.error('[Wheel Spin API] Error spinning wheel:', error);
    return res.status(500).json({ error: 'Failed to spin wheel' });
  }
}
