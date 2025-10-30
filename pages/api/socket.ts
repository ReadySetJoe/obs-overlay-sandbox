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

      socket.on('chat-message', data => {
        io.emit('chat-message', data);
      });

      socket.on('color-scheme-change', data => {
        io.emit('color-scheme-change', data);
      });

      socket.on('weather-change', data => {
        io.emit('weather-change', data);
      });

      socket.on('audio-level', data => {
        io.emit('audio-level', data);
      });

      socket.on('now-playing', data => {
        io.emit('now-playing', data);
      });

      socket.on('scene-toggle', data => {
        io.emit('scene-toggle', data);
      });

      socket.on('visualizer-config', data => {
        io.emit('visualizer-config', data);
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
