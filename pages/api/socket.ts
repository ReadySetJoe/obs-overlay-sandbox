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
        console.log(`[Socket Server] Client ${socket.id} joining session: ${sessionId}`);
        socket.join(sessionId);
        socket.data.sessionId = sessionId;
        console.log(`[Socket Server] Client ${socket.id} successfully joined session: ${sessionId}`);
      });

      // Emit events to the specific session room
      socket.on('chat-message', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('chat-message', data);
        }
      });

      socket.on('color-scheme-change', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('color-scheme-change', data);
        }
      });

      socket.on('custom-colors-change', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          console.log(
            '[Socket Server] Relaying custom-colors-change to session:',
            sessionId,
            data
          );
          io.to(sessionId).emit('custom-colors-change', data);
        }
      });

      socket.on('font-family-change', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('font-family-change', data);
        }
      });

      socket.on('event-labels-config', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('event-labels-config', data);
        }
      });

      socket.on('stream-stats-config', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('stream-stats-config', data);
        }
      });

      socket.on('weather-change', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('weather-change', data);
        }
      });

      socket.on('now-playing', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('now-playing', data);
        }
      });

      socket.on('scene-toggle', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('scene-toggle', data);
        }
      });

      socket.on('countdown-timers', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('countdown-timers', data);
        }
      });

      socket.on('emote-wall', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('emote-wall', data);
        }
      });

      socket.on('component-layouts', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('component-layouts', data);
        }
      });

      socket.on('chat-highlight', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('chat-highlight', data);
        }
      });

      socket.on('paint-state', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('paint-state', data);
        }
      });

      socket.on('paint-command', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('paint-command', data);
        }
      });

      socket.on('paint-all-command', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('paint-all-command', data);
        }
      });

      socket.on('background-change', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('background-change', data);
        }
      });

      socket.on('alert-trigger', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('alert-trigger', data);
        }
      });

      socket.on('disconnect', (reason) => {
        console.log(`[Socket Server] Client ${socket.id} disconnected. Reason: ${reason}`);
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
