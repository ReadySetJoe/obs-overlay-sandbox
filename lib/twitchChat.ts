// lib/twitchChat.ts
import tmi from 'tmi.js';
import {
  ChatMessage,
  UserRole,
  StreamStatsData,
  TTSMessage,
} from '@/types/overlay';
import { Server as SocketIOServer } from 'socket.io';
import { prisma } from '@/lib/prisma';
import Sentiment from 'sentiment';
import { Filter } from 'bad-words';

interface TwitchChatConnection {
  client: tmi.Client;
  channel: string;
  sessionId: string;
}

// Store active Twitch chat connections
const activeConnections = new Map<string, TwitchChatConnection>();

// Initialize sentiment analyzer
const sentiment = new Sentiment();

// Initialize profanity filter
const profanityFilter = new Filter();

// Store TTS cooldowns per user per session (sessionId -> username -> timestamp)
const ttsCooldowns = new Map<string, Map<string, number>>();

// Helper to detect URLs in text
function containsURL(text: string): boolean {
  const urlPattern =
    /(?:https?:\/\/|www\.)\S+|(?:\w+\.(?:com|net|org|edu|gov|io|co|tv|gg|me|us|uk|ca|de|fr|it|es|jp|cn|ru|br|in)\b)/gi;
  return urlPattern.test(text);
}

// Helper to check if text is safe for TTS
function isSafeForTTS(text: string): { safe: boolean; reason?: string } {
  // Check for profanity
  if (profanityFilter.isProfane(text)) {
    return { safe: false, reason: 'profanity detected' };
  }

  // Check for URLs
  if (containsURL(text)) {
    return { safe: false, reason: 'URLs not allowed' };
  }

  // Check for excessive special characters (potential spam/trolling)
  // Allow common punctuation: apostrophes, commas, periods, exclamation, question marks, hyphens
  const specialCharRatio =
    (text.match(/[^a-zA-Z0-9\s'",.\-!?]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) {
    return { safe: false, reason: 'excessive special characters' };
  }

  // Check for repeated characters (spam detection)
  if (/(.)\1{10,}/.test(text)) {
    return { safe: false, reason: 'repeated characters spam' };
  }

  return { safe: true };
}

// Helper to update stream stats and chatter sentiment
async function updateStreamStats(
  sessionId: string,
  username: string,
  displayName: string | undefined,
  message: string,
  io: SocketIOServer
) {
  try {
    // Analyze sentiment
    const result = sentiment.analyze(message);
    const sentimentScore = result.score;

    // Determine sentiment category
    let positiveMessages = 0;
    let negativeMessages = 0;
    let neutralMessages = 0;

    if (sentimentScore > 0) {
      positiveMessages = 1;
    } else if (sentimentScore < 0) {
      negativeMessages = 1;
    } else {
      neutralMessages = 1;
    }

    // Update or create chatter record
    const chatter = await prisma.chatter.upsert({
      where: {
        sessionId_username: {
          sessionId,
          username: username.toLowerCase(),
        },
      },
      update: {
        displayName: displayName || username,
        messageCount: { increment: 1 },
        totalSentiment: { increment: sentimentScore },
        positiveMessages: { increment: positiveMessages },
        negativeMessages: { increment: negativeMessages },
        neutralMessages: { increment: neutralMessages },
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        sessionId,
        username: username.toLowerCase(),
        displayName: displayName || username,
        messageCount: 1,
        totalSentiment: sentimentScore,
        averageSentiment: sentimentScore,
        positiveMessages,
        negativeMessages,
        neutralMessages,
        firstMessageAt: new Date(),
        lastMessageAt: new Date(),
      },
    });

    // Calculate average sentiment
    const averageSentiment = chatter.totalSentiment / chatter.messageCount;
    await prisma.chatter.update({
      where: { id: chatter.id },
      data: { averageSentiment },
    });

    // Get stats for this session
    const chatters = await prisma.chatter.findMany({
      where: { sessionId },
      orderBy: { averageSentiment: 'desc' },
    });

    // Find most active chatter
    const mostActive = chatters.reduce((prev, current) =>
      current.messageCount > prev.messageCount ? current : prev
    );

    // Find nicest chatter (highest average sentiment)
    const nicest = chatters[0]; // Already sorted by averageSentiment desc

    // Calculate overall positivity score
    const totalMessages = chatters.reduce((sum, c) => sum + c.messageCount, 0);
    const totalSentiment = chatters.reduce(
      (sum, c) => sum + c.totalSentiment,
      0
    );
    const overallPositivity =
      totalMessages > 0 ? totalSentiment / totalMessages : 0;

    // Calculate unique chatters
    const uniqueChatters = chatters.length;

    // Load layout to get existing streamStatsData
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) return;

    let statsData: StreamStatsData = {
      currentFollowers: 0,
      currentSubs: 0,
      currentBits: 0,
      totalMessages: 0,
      uniqueChatters: 0,
      messagesPerMinute: 0,
      mostActiveChatterCount: 0,
      overallPositivityScore: 0,
      nicestChatterScore: 0,
    };

    // Parse existing data
    if (layout.streamStatsData) {
      try {
        statsData = JSON.parse(layout.streamStatsData);
      } catch (error) {
        console.error('Error parsing stream stats data:', error);
      }
    }

    // Update stats
    statsData.totalMessages = totalMessages;
    statsData.uniqueChatters = uniqueChatters;
    statsData.mostActiveChatter = mostActive.displayName || mostActive.username;
    statsData.mostActiveChatterCount = mostActive.messageCount;
    statsData.overallPositivityScore = overallPositivity;
    statsData.nicestChatter = nicest.displayName || nicest.username;
    statsData.nicestChatterScore = nicest.averageSentiment;

    // Calculate messages per minute
    if (statsData.streamStartTime) {
      const startTime = new Date(statsData.streamStartTime);
      const now = new Date();
      const minutesElapsed = (now.getTime() - startTime.getTime()) / 1000 / 60;
      statsData.messagesPerMinute =
        minutesElapsed > 0 ? totalMessages / minutesElapsed : 0;
    } else {
      // If no start time set, set it now
      statsData.streamStartTime = new Date().toISOString();
    }

    statsData.lastMessageTime = new Date().toISOString();

    // Save to database
    await prisma.layout.update({
      where: { sessionId },
      data: { streamStatsData: JSON.stringify(statsData) },
    });

    // Emit to overlay
    io.to(sessionId).emit('stream-stats-update', statsData);
  } catch (error) {
    console.error('Error updating stream stats:', error);
  }
}

export function getTwitchUserRole(tags: tmi.ChatUserstate): UserRole {
  if (tags.badges?.broadcaster === '1') return 'moderator';
  if (tags.mod) return 'moderator';
  if (tags.badges?.vip === '1') return 'vip';
  if (tags.subscriber) return 'subscriber';
  if (tags['first-msg']) return 'first-timer';
  return 'viewer';
}

// Helper to update event labels in database
async function updateEventLabels(
  sessionId: string,
  updates: Record<string, unknown>,
  io: SocketIOServer
) {
  try {
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) return;

    let eventLabelsData: Record<string, unknown> = {};
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

// Helper to increment stream stats counts (followers, subs, bits)
async function incrementStreamStatCount(
  sessionId: string,
  field: 'currentFollowers' | 'currentSubs' | 'currentBits',
  amount: number,
  io: SocketIOServer
) {
  try {
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout) return;

    let statsData: StreamStatsData = {
      currentFollowers: 0,
      currentSubs: 0,
      currentBits: 0,
      totalMessages: 0,
      uniqueChatters: 0,
      messagesPerMinute: 0,
      mostActiveChatterCount: 0,
      overallPositivityScore: 0,
      nicestChatterScore: 0,
    };

    if (layout.streamStatsData) {
      try {
        statsData = JSON.parse(layout.streamStatsData);
      } catch (error) {
        console.error('Error parsing stream stats data:', error);
      }
    }

    // Increment the field
    statsData[field] = (statsData[field] || 0) + amount;

    // Save to database
    await prisma.layout.update({
      where: { sessionId },
      data: { streamStatsData: JSON.stringify(statsData) },
    });

    // Emit to overlay
    io.to(sessionId).emit('stream-stats-update', statsData);
  } catch (error) {
    console.error('Error incrementing stream stat count:', error);
  }
}

// Helper to check if user has permission to trigger TTS
function hasPermission(
  userRole: UserRole,
  requiredPermission: string
): boolean {
  if (requiredPermission === 'everyone') return true;
  if (requiredPermission === 'subscribers') {
    return ['subscriber', 'vip', 'moderator'].includes(userRole);
  }
  if (requiredPermission === 'vips') {
    return ['vip', 'moderator'].includes(userRole);
  }
  if (requiredPermission === 'moderators') {
    return userRole === 'moderator';
  }
  return false;
}

// Helper to process TTS from chat messages
async function processTTSFromChat(
  sessionId: string,
  username: string,
  message: string,
  userRole: UserRole,
  io: SocketIOServer
) {
  try {
    // Only process messages that start with !tts (check early to avoid DB queries)
    if (!message.trim().toLowerCase().startsWith('!tts ')) {
      return;
    }

    console.log(`[TTS] Processing !tts command from ${username}: ${message}`);

    // Load TTS config
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
      include: { ttsConfig: true },
    });

    if (!layout) {
      console.log(`[TTS] No layout found for session ${sessionId}`);
      return;
    }

    if (!layout.ttsConfig) {
      console.log(`[TTS] No TTS config found for session ${sessionId}`);
      return;
    }

    const ttsConfig = layout.ttsConfig;

    // Check if chat is in allowed sources
    const allowedSources = ttsConfig.allowedSources
      .split(',')
      .map(s => s.trim());
    if (!allowedSources.includes('chat')) {
      console.log(
        `[TTS] Chat not in allowed sources: ${ttsConfig.allowedSources}`
      );
      return;
    }

    // Extract the actual text after !tts
    const ttsText = message.trim().substring(5).trim(); // Remove '!tts ' prefix

    // Check if there's any text after the command
    if (!ttsText) {
      return;
    }

    // Check if text is safe for TTS (automatic moderation)
    const safetyCheck = isSafeForTTS(ttsText);
    if (!safetyCheck.safe) {
      console.log(
        `[TTS] Blocked message from ${username}: ${safetyCheck.reason}`
      );
      return;
    }

    // Check permissions
    if (!hasPermission(userRole, ttsConfig.chatPermissions)) {
      console.log(
        `[TTS] User ${username} with role ${userRole} doesn't have permission (required: ${ttsConfig.chatPermissions})`
      );
      return;
    }

    // Check character length (of the extracted text, not the full message)
    const messageLength = ttsText.length;
    if (
      messageLength < ttsConfig.minCharLength ||
      messageLength > ttsConfig.maxCharLength
    ) {
      console.log(
        `[TTS] Message length ${messageLength} outside range ${ttsConfig.minCharLength}-${ttsConfig.maxCharLength}`
      );
      return;
    }

    // Check cooldown
    const now = Date.now();
    if (!ttsCooldowns.has(sessionId)) {
      ttsCooldowns.set(sessionId, new Map());
    }
    const sessionCooldowns = ttsCooldowns.get(sessionId)!;
    const lastTTS = sessionCooldowns.get(username.toLowerCase()) || 0;
    const cooldownMs = ttsConfig.cooldownSeconds * 1000;

    if (now - lastTTS < cooldownMs) {
      console.log(
        `[TTS] User ${username} is on cooldown (${Math.ceil((cooldownMs - (now - lastTTS)) / 1000)}s remaining)`
      );
      return; // User is still in cooldown
    }

    // Update cooldown
    sessionCooldowns.set(username.toLowerCase(), now);

    // Create TTS message (use the extracted text without the !tts prefix)
    const ttsMessage: TTSMessage = {
      id: `tts-${Date.now()}-${Math.random()}`,
      text: ttsText,
      voice: ttsConfig.voice,
      rate: ttsConfig.rate,
      pitch: ttsConfig.pitch,
      volume: ttsConfig.volume,
      priority: 'normal',
      timestamp: now,
    };

    // Emit to overlay
    console.log(`[TTS] Emitting tts-speak event:`, ttsMessage);
    io.to(sessionId).emit('tts-speak', ttsMessage);
  } catch (error) {
    console.error('Error processing TTS from chat:', error);
  }
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

    // Update stream stats and sentiment analysis
    const username = tags.username || 'anonymous';
    const displayName = tags['display-name'];
    updateStreamStats(sessionId, username, displayName, message, io);

    // Process TTS from chat (if enabled and user has permission)
    processTTSFromChat(sessionId, username, message, chatMessage.role, io);

    // Check for paint-by-numbers commands
    // Debug command: !paint all (development only)
    if (
      process.env.NODE_ENV === 'development' &&
      message.trim().match(/^!paint\s+all$/i)
    ) {
      const username = tags['display-name'] || tags.username || 'Anonymous';
      io.to(sessionId).emit('paint-all-command', {
        username,
        timestamp: Date.now(),
      });
      return;
    }

    // Debug command: !paint random (development only)
    if (
      process.env.NODE_ENV === 'development' &&
      message.trim().match(/^!paint\s+random$/i)
    ) {
      const username = tags['display-name'] || tags.username || 'Anonymous';
      io.to(sessionId).emit('paint-random-command', {
        username,
        timestamp: Date.now(),
      });
      return;
    }

    // Regular paint commands: !paint 1 red, !paint 2 #FF0000, !paint 3
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

  // Listen for subscriptions (new subs)
  client.on('subscription', (channel, username, method, message, userstate) => {
    const displayName = userstate['display-name'] || username;
    const tier = method.plan
      ? method.plan.replace('Prime', '1').replace(/\D/g, '')
      : '1';

    io.to(sessionId).emit('alert-trigger', {
      eventType: 'sub',
      username: displayName,
      tier: tier,
      timestamp: Date.now(),
    });

    // Update event labels
    updateEventLabels(sessionId, { latestSub: displayName }, io);

    // Increment sub count in stream stats
    incrementStreamStatCount(sessionId, 'currentSubs', 1, io);
  });

  // Listen for resubscriptions
  client.on(
    'resub',
    (channel, username, months, message, userstate, methods) => {
      const displayName = userstate['display-name'] || username;
      const tier = methods.plan
        ? methods.plan.replace('Prime', '1').replace(/\D/g, '')
        : '1';

      io.to(sessionId).emit('alert-trigger', {
        eventType: 'sub',
        username: displayName,
        tier: tier,
        months: months,
        timestamp: Date.now(),
      });

      // Update event labels
      updateEventLabels(sessionId, { latestSub: displayName }, io);

      // Increment sub count in stream stats
      incrementStreamStatCount(sessionId, 'currentSubs', 1, io);
    }
  );

  // Listen for gift subscriptions
  client.on(
    'subgift',
    (channel, username, streakMonths, recipient, methods, userstate) => {
      const displayName = userstate['display-name'] || username;
      const recipientName = recipient; // Use the recipient parameter directly
      const tier = methods.plan
        ? methods.plan.replace('Prime', '1').replace(/\D/g, '')
        : '1';

      io.to(sessionId).emit('alert-trigger', {
        eventType: 'giftsub',
        username: displayName,
        recipient: recipientName,
        tier: tier,
        timestamp: Date.now(),
      });

      // Update event labels
      updateEventLabels(
        sessionId,
        { latestGiftSub: { gifter: displayName, recipient: recipientName } },
        io
      );

      // Increment sub count in stream stats (gift subs count as subs)
      incrementStreamStatCount(sessionId, 'currentSubs', 1, io);
    }
  );

  // Listen for mystery gift subscriptions
  client.on(
    'submysterygift',
    (channel, username, numbOfSubs, methods, userstate) => {
      const displayName = userstate['display-name'] || username;
      const tier = methods.plan
        ? methods.plan.replace('Prime', '1').replace(/\D/g, '')
        : '1';

      // Emit multiple gift sub alerts for mystery gifts
      for (let i = 0; i < numbOfSubs; i++) {
        io.to(sessionId).emit('alert-trigger', {
          eventType: 'giftsub',
          username: displayName,
          recipient: 'Mystery Recipient',
          tier: tier,
          timestamp: Date.now() + i, // Slight offset to queue them
        });
      }

      // Update event labels (for mystery gifts, don't specify recipient)
      updateEventLabels(
        sessionId,
        { latestGiftSub: { gifter: displayName } },
        io
      );

      // Increment sub count for all mystery gift subs
      incrementStreamStatCount(sessionId, 'currentSubs', numbOfSubs, io);
    }
  );

  // Listen for bits/cheers
  client.on('cheer', (_channel, userstate) => {
    const displayName =
      userstate['display-name'] || userstate.username || 'Anonymous';
    const bits = parseInt(userstate.bits || '0', 10);

    if (bits > 0) {
      io.to(sessionId).emit('alert-trigger', {
        eventType: 'bits',
        username: displayName,
        amount: bits,
        timestamp: Date.now(),
      });

      // Update event labels
      updateEventLabels(
        sessionId,
        { latestBits: { username: displayName, amount: bits } },
        io
      );

      // Increment bits count in stream stats
      incrementStreamStatCount(sessionId, 'currentBits', bits, io);
    }
  });

  // Listen for raids
  client.on('raided', (channel, username, viewers) => {
    io.to(sessionId).emit('alert-trigger', {
      eventType: 'raid',
      username: username,
      count: viewers,
      timestamp: Date.now(),
    });

    // Update event labels
    updateEventLabels(
      sessionId,
      { latestRaid: { username: username, count: viewers } },
      io
    );
  });

  client.on('connected', () => {
    // Connection successful
  });

  client.on('disconnected', () => {
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
