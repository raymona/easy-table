import { Server } from 'socket.io';

export function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join venue room for scoped broadcasts
    socket.on('join:venue', (venueId) => {
      socket.join(`venue:${venueId}`);
      console.log(`Socket ${socket.id} joined venue:${venueId}`);
    });

    // Join KDS station room
    socket.on('join:kds', ({ venueId, stationKey }) => {
      socket.join(`kds:${venueId}:${stationKey}`);
      console.log(`Socket ${socket.id} joined kds:${venueId}:${stationKey}`);
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
