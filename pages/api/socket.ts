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

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        credentials: true,
      },
      maxHttpBufferSize: 1e8, // 100 MB (default is 1 MB)
    });

    io.on('connection', socket => {
      // Handle joining a session room
      socket.on('join-session', (sessionId: string) => {
        socket.join(sessionId);
        socket.data.sessionId = sessionId;
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

      socket.on('disconnect', () => {
        // Client disconnected
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default SocketHandler;
