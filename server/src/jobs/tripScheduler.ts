import cron from 'node-cron';
import { Trip } from '../models/Trip';
import { Booking } from '../models/Booking';

export const startTripScheduler = () => {
  console.log('Starting Trip Scheduler Cron Job...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find all Scheduled trips whose departure time has passed
      // Wait, date is stored at 00:00:00 UTC, and departureTime is a string like "14:00"
      // We need to parse departureTime and combine it with date.
      const trips = await Trip.find({ status: { $in: ['Scheduled', 'Active'] } });

      for (const trip of trips) {
        // Parse "HH:mm"
        const [hoursStr, minutesStr] = trip.departureTime.split(':');
        const hours = parseInt(hoursStr, 10);
        const minutes = parseInt(minutesStr, 10);

        // Calculate the absolute departure Date object
        const departureDate = new Date(trip.date);
        departureDate.setUTCHours(hours, minutes, 0, 0);

        // Case 1: Scheduled -> Active (If current time >= departureDate)
        if (trip.status === 'Scheduled' && now >= departureDate) {
          trip.status = 'Active';
          await trip.save();
          console.log(`[Trip Scheduler] Trip ${trip._id} (${trip.route}) is now Active.`);
        }

        // Case 2: Active -> Completed (If current time >= departureDate + 1 hour)
        const completedDate = new Date(departureDate.getTime() + 60 * 60 * 1000); // 1 hour buffer
        if (trip.status === 'Active' && now >= completedDate) {
          trip.status = 'Completed';
          await trip.save();

          // We also automatically mark all Pending/Confirmed bookings for this trip as 'Completed'
          await Booking.updateMany(
            { tripId: trip._id, status: { $in: ['Pending', 'Confirmed'] } },
            { $set: { status: 'Completed' } }
          );

          console.log(`[Trip Scheduler] Trip ${trip._id} (${trip.route}) is now Completed.`);
        }
      }
    } catch (error) {
      console.error('[Trip Scheduler] Error running cron job:', error);
    }
  });
};
