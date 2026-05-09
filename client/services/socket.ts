import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:5000';

let socket: Socket;

export const initiateSocketConnection = () => {
  socket = io(SOCKET_URL);
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

// ── Trip occupancy updates ────────────────────────────────────────────────────
export const subscribeToTrip = (tripId: string, cb: (data: any) => void) => {
  if (!socket) return;
  socket.emit('join_trip_room', tripId);
  socket.on('seat_booked', cb);
};

export const unsubscribeFromTrip = (tripId: string) => {
  if (!socket) return;
  socket.emit('leave_trip_room', tripId);
  socket.off('seat_booked');
};

// ── Booking status updates ────────────────────────────────────────────────────
// Called after a student submits a booking and is waiting on admin approval.
// Fires when admin confirms or rejects, so the student page updates instantly.
export const subscribeToBooking = (
  bookingId: string,
  cb: (data: { bookingId: string; status: 'Confirmed' | 'Cancelled'; referenceId: string }) => void
) => {
  if (!socket) return;
  socket.emit('join_booking_room', bookingId);
  socket.on('booking_status_updated', cb);
};

export const unsubscribeFromBooking = (bookingId: string) => {
  if (!socket) return;
  socket.emit('leave_booking_room', bookingId);
  socket.off('booking_status_updated');
};
