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
    console.log('Setting up Socket.io...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
      },
    });

    io.on('connection', socket => {
      console.log('Client connected:', socket.id);

      // Handle joining a session room
      socket.on('join-session', (sessionId: string) => {
        console.log(`Socket ${socket.id} joining session: ${sessionId}`);
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

      socket.on('visualizer-config', data => {
        const sessionId = socket.data.sessionId;
        if (sessionId) {
          io.to(sessionId).emit('visualizer-config', data);
        }
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export default SocketHandler;
