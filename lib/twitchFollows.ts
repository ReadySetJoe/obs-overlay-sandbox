// lib/twitchFollows.ts
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';

interface FollowMonitor {
  intervalId: NodeJS.Timeout;
  lastFollowerId: string | null;
  broadcasterId: string;
}

// Store active follow monitors
const activeMonitors = new Map<string, FollowMonitor>();

// Helper to update event labels in database
async function updateEventLabels(
  sessionId: string,
  updates: any,
  io: SocketIOServer
) {
  try {
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) return;

    let eventLabelsData: any = {};
    if (layout.eventLabelsData) {
      try {
        eventLabelsData = JSON.parse(layout.eventLabelsData);
      } catch (error) {
        console.error('Error parsing event labels data:', error);
      }
    }

    // Merge updates
    eventLabelsData = { ...eventLabelsData, ...updates };

    // Save to database
    await prisma.layout.update({
      where: { sessionId },
      data: { eventLabelsData: JSON.stringify(eventLabelsData) },
    });

    // Emit to overlay
    io.to(sessionId).emit('event-labels-update', eventLabelsData);
  } catch (error) {
    console.error('Error updating event labels:', error);
  }
}

/**
 * Get broadcaster ID from username
 */
async function getBroadcasterIdFromUsername(
  username: string,
  accessToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/users?login=${username}`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to get broadcaster ID:', await response.text());
      return null;
    }

    const data = await response.json();
    if (data.data && data.data.length > 0) {
      return data.data[0].id;
    }

    return null;
  } catch (error) {
    console.error('Error getting broadcaster ID:', error);
    return null;
  }
}

/**
 * Get recent followers for a broadcaster
 */
async function getRecentFollowers(
  broadcasterId: string,
  accessToken: string,
  limit: number = 1
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${broadcasterId}&first=${limit}`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID!,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('Failed to get followers:', await response.text());
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('Error getting followers:', error);
    return [];
  }
}

/**
 * Start monitoring follows for a Twitch channel
 */
export async function startFollowMonitoring(
  twitchUsername: string,
  accessToken: string,
  sessionId: string,
  io: SocketIOServer
): Promise<void> {
  // Stop any existing monitor for this session
  await stopFollowMonitoring(sessionId);

  // Get broadcaster ID
  const broadcasterId = await getBroadcasterIdFromUsername(
    twitchUsername,
    accessToken
  );

  if (!broadcasterId) {
    console.error('Could not get broadcaster ID for:', twitchUsername);
    return;
  }

  // Get the most recent follower to establish baseline
  const initialFollowers = await getRecentFollowers(
    broadcasterId,
    accessToken,
    1
  );
  const lastFollowerId = initialFollowers[0]?.user_id || null;

  // Poll for new followers every 30 seconds
  const intervalId = setInterval(async () => {
    try {
      const followers = await getRecentFollowers(broadcasterId, accessToken, 5);

      if (followers.length === 0) return;

      const monitor = activeMonitors.get(sessionId);
      if (!monitor) return; // Monitor was stopped

      // Check for new followers
      for (const follower of followers) {
        // If this is a new follower (not seen before)
        if (follower.user_id !== monitor.lastFollowerId) {
          // Emit alert
          io.to(sessionId).emit('alert-trigger', {
            eventType: 'follow',
            username: follower.user_name,
            timestamp: Date.now(),
          });

          // Update event labels
          updateEventLabels(sessionId, { latestFollower: follower.user_name }, io);

          // Update last follower ID
          monitor.lastFollowerId = follower.user_id;

          // Only process the most recent new follow per poll
          break;
        }
      }
    } catch (error) {
      console.error('Error polling for followers:', error);
    }
  }, 30000); // Poll every 30 seconds

  // Store the monitor
  activeMonitors.set(sessionId, {
    intervalId,
    lastFollowerId,
    broadcasterId,
  });

  console.log(
    `Started follow monitoring for ${twitchUsername} (${broadcasterId})`
  );
}

/**
 * Stop monitoring follows for a session
 */
export async function stopFollowMonitoring(sessionId: string): Promise<void> {
  const monitor = activeMonitors.get(sessionId);
  if (!monitor) return;

  clearInterval(monitor.intervalId);
  activeMonitors.delete(sessionId);

  console.log(`Stopped follow monitoring for session ${sessionId}`);
}

/**
 * Check if a session is currently monitoring follows
 */
export function isMonitoringFollows(sessionId: string): boolean {
  return activeMonitors.has(sessionId);
}
