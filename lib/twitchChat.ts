// lib/twitchChat.ts
import tmi from 'tmi.js';
import { ChatMessage, UserRole } from '@/types/overlay';
import { Server as SocketIOServer } from 'socket.io';

interface TwitchChatConnection {
  client: tmi.Client;
  channel: string;
  sessionId: string;
}

// Store active Twitch chat connections
const activeConnections = new Map<string, TwitchChatConnection>();

export function getTwitchUserRole(tags: tmi.ChatUserstate): UserRole {
  if (tags.badges?.broadcaster === '1') return 'moderator';
  if (tags.mod) return 'moderator';
  if (tags.badges?.vip === '1') return 'vip';
  if (tags.subscriber) return 'subscriber';
  if (tags['first-msg']) return 'first-timer';
  return 'viewer';
}

export async function startTwitchChatMonitoring(
  twitchUsername: string,
  sessionId: string,
  io: SocketIOServer
): Promise<void> {
  // Check if already connected
  const existing = activeConnections.get(sessionId);
  if (existing) {
    // If already monitoring the same channel, just return
    if (existing.channel.toLowerCase() === twitchUsername.toLowerCase()) {
      return;
    }
    // Otherwise, disconnect the old one first
    await stopTwitchChatMonitoring(sessionId);
  }

  const client = new tmi.Client({
    connection: {
      secure: true,
      reconnect: true,
    },
    channels: [twitchUsername],
  });

  client.on('message', (channel, tags, message, self) => {
    if (self) return; // Ignore messages from the bot itself

    const chatMessage: ChatMessage = {
      id: tags.id || `${Date.now()}-${Math.random()}`,
      username: tags['display-name'] || tags.username || 'Anonymous',
      message: message,
      role: getTwitchUserRole(tags),
      timestamp: Date.now(),
      color: tags.color || undefined,
    };

    // Emit to the session room
    io.to(sessionId).emit('chat-message', chatMessage);

    // Check for paint-by-numbers commands
    // Supports: !paint 1 red, !paint 2 #FF0000, !paint 3
    const paintCommand = message
      .trim()
      .match(/^!paint\s+(\d+)(?:\s+([#\w]+))?$/i);
    if (paintCommand) {
      const regionId = parseInt(paintCommand[1], 10);
      const customColor = paintCommand[2]; // Optional color (name or hex)
      const username = tags['display-name'] || tags.username || 'Anonymous';

      io.to(sessionId).emit('paint-command', {
        regionId,
        username,
        timestamp: Date.now(),
        customColor: customColor || undefined,
      });
    }
  });

  client.on('connected', (address, port) => {
    // Connection successful
  });

  client.on('disconnected', reason => {
    activeConnections.delete(sessionId);
  });

  try {
    await client.connect();
    activeConnections.set(sessionId, {
      client,
      channel: twitchUsername,
      sessionId,
    });
  } catch (error) {
    console.error('Error connecting to Twitch chat:', error);
    throw error;
  }
}

export async function stopTwitchChatMonitoring(
  sessionId: string
): Promise<void> {
  const connection = activeConnections.get(sessionId);
  if (!connection) {
    return;
  }

  try {
    await connection.client.disconnect();
    activeConnections.delete(sessionId);
  } catch (error) {
    console.error('Error disconnecting from Twitch chat:', error);
    throw error;
  }
}

export function isSessionMonitoring(sessionId: string): boolean {
  return activeConnections.has(sessionId);
}
