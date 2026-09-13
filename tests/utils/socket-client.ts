import { io, Socket } from 'socket.io-client';

/**
 * Connect a Socket.io client from the test process (not the browser) and join a
 * session room, so specs can inject overlay events deterministically.
 *
 * The browser-based helpers in test-helpers.ts cannot do this: they read
 * window.socket, which the app never sets.
 *
 * Note the server relays with io.to(sessionId), which includes the sender, so
 * an event emitted here reaches every overlay page in the same session.
 */
export async function connectTestSocket(
  sessionId: string,
  baseURL = 'http://localhost:3000'
): Promise<Socket> {
  // Ensure the Socket.io server has been initialised; the app does this by
  // hitting the same endpoint before connecting.
  await fetch(`${baseURL}/api/socket`);

  const socket = io(baseURL, {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('Test socket failed to connect within 10s')),
      10000
    );
    socket.on('connect', () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on('connect_error', err => {
      clearTimeout(timer);
      reject(err);
    });
  });

  socket.emit('join-session', sessionId);

  return socket;
}
