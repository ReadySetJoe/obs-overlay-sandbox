// app/api/socket/route.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// Global variable to store the socket server instance
let globalSocketServer: SocketIOServer | null = null;

// Store a reference to the server with io
let serverWithIO: (NetServer & { io?: SocketIOServer }) | null = null;

// Helper function to get the socket server instance
export function getSocketServer(): SocketIOServer | null {
  // First try the global variable
  if (globalSocketServer) {
    return globalSocketServer;
  }

  // Fallback: try to get from the stored server reference
  if (serverWithIO?.io) {
    globalSocketServer = serverWithIO.io;
    return serverWithIO.io;
  }

  return null;
}

/**
 * Socket events that are relayed verbatim: rebroadcast to everyone in the
 * sender's session room under the same event name. Adding a new relayed
 * event is a one-line change here.
 *
 * These are emitted with io.to(sessionId), which INCLUDES the sender - that
 * matches the hand-written handlers this list replaced. Use socket.to() if a
 * future event must exclude the sender, and write it out separately.
 */
const RELAYED_EVENTS = [
  'chat-message',
  'color-scheme-change',
  'custom-colors-change',
  'font-family-change',
  'event-labels-config',
  'stream-stats-config',
  'weather-change',
  'now-playing',
  'scene-toggle',
  'countdown-timers',
  'emote-wall',
  'component-layouts',
  'chat-highlight',
  'paint-state',
  'paint-command',
  'paint-all-command',
  'background-change',
  'alert-trigger',
  'wheel-config-update',
  'wheel-list-update',
  'wheel-spin',
  'tts-speak',
  'tts-config-update',
] as const;

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('[Socket Server] Initializing Socket.io server...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true,
      },
      maxHttpBufferSize: 1e8, // 100 MB (default is 1 MB)
      // OBS-compatible settings
      pingTimeout: 60000, // 60 seconds (increased from default 5s for OBS)
      pingInterval: 25000, // 25 seconds (keep connection alive)
      upgradeTimeout: 30000, // 30 seconds for WebSocket upgrade
      connectTimeout: 45000, // 45 seconds for initial connection
      transports: ['websocket', 'polling'], // Support both transports
      allowUpgrades: true, // Allow transport upgrades (polling → websocket)
    });

    console.log('[Socket Server] Socket.io server initialized successfully');

    io.on('connection', socket => {
      console.log('[Socket Server] Client connected:', socket.id);
      console.log('[Socket Server] Transport:', socket.conn.transport.name);

      // Handle joining a session room
      socket.on('join-session', (sessionId: string) => {
        console.log(
          `[Socket Server] Client ${socket.id} joining session: ${sessionId}`
        );
        socket.join(sessionId);
        socket.data.sessionId = sessionId;
        console.log(
          `[Socket Server] Client ${socket.id} successfully joined session: ${sessionId}`
        );
      });

      // Relay every event in RELAYED_EVENTS to the sender's session room.
      for (const event of RELAYED_EVENTS) {
        socket.on(event, (data: unknown) => {
          const sessionId = socket.data.sessionId;
          if (sessionId) {
            io.to(sessionId).emit(event, data);
          }
        });
      }

      socket.on('disconnect', reason => {
        console.log(
          `[Socket Server] Client ${socket.id} disconnected. Reason: ${reason}`
        );
      });
    });

    res.socket.server.io = io;
    globalSocketServer = io; // Store globally for API routes to access
    serverWithIO = res.socket.server; // Store server reference for recovery
  } else {
    // Server already initialized, update our global references
    globalSocketServer = res.socket.server.io;
    serverWithIO = res.socket.server;
  }

  res.end();
};

export default SocketHandler;
