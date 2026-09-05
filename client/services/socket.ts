import Pusher from 'pusher-js';

let pusher: Pusher | null = null;

export const initiateSocketConnection = () => {
  if (pusher) return;
  
  // Connect to Pusher using the environment variables
  pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || '', {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || '',
  });
};

export const disconnectSocket = () => {
  if (pusher) {
    pusher.disconnect();
    pusher = null;
  }
};

export const subscribeToTrip = (tripId: string, cb: (data: any) => void) => {
  if (!pusher) return;
  const channel = pusher.subscribe(`trip_${tripId}`);
  channel.bind('seat_booked', cb);
};

export const unsubscribeFromTrip = (tripId: string) => {
  if (!pusher) return;
  pusher.unsubscribe(`trip_${tripId}`);
};

export const subscribeToBooking = (bookingId: string, cb: (data: any) => void) => {
  if (!pusher) return;
  const channel = pusher.subscribe(`booking_${bookingId}`);
  channel.bind('booking_status_updated', cb);
};

export const unsubscribeFromBooking = (bookingId: string) => {
  if (!pusher) return;
  pusher.unsubscribe(`booking_${bookingId}`);
};
