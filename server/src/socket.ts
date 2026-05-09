import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from './utils/logger';

let io: SocketIOServer;

export const initSocket = (server: HttpServer) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Trip rooms — occupancy updates
    socket.on('join_trip_room', (tripId) => {
      socket.join(`trip_${tripId}`);
      logger.info(`Socket ${socket.id} joined trip room: ${tripId}`);
    });

    socket.on('leave_trip_room', (tripId) => {
      socket.leave(`trip_${tripId}`);
      logger.info(`Socket ${socket.id} left trip room: ${tripId}`);
    });

    // Booking rooms — status updates (Pending → Confirmed / Cancelled)
    socket.on('join_booking_room', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      logger.info(`Socket ${socket.id} watching booking: ${bookingId}`);
    });

    socket.on('leave_booking_room', (bookingId) => {
      socket.leave(`booking_${bookingId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized!');
  return io;
};
