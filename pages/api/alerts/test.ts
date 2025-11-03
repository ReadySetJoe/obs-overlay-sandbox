// pages/api/alerts/test.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getSocketServer } from '../socket';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId, eventType, username, amount, count, tier } = req.body;

  if (!sessionId || !eventType) {
    return res.status(400).json({ error: 'Session ID and event type are required' });
  }

  try {
    const io = getSocketServer();
    if (!io) {
      return res.status(500).json({ error: 'Socket server not initialized' });
    }

    // Generate test event based on type
    const testEvent = {
      eventType,
      username: username || 'TestUser',
      amount: amount,
      count: count,
      tier: tier,
      timestamp: Date.now(),
    };

    // Emit to session room
    io.to(sessionId).emit('alert-trigger', testEvent);

    return res.status(200).json({ success: true, event: testEvent });
  } catch (error) {
    console.error('Error triggering test alert:', error);
    return res.status(500).json({ error: 'Failed to trigger test alert' });
  }
}
