import mongoose from 'mongoose';
import { Vehicle } from '../models/Vehicle';
import { Trip } from '../models/Trip';
import { Booking } from '../models/Booking';
import { Location } from '../models/Location';
import { AppError } from '../middleware/errorHandler';

// ─── Pickup price is now resolved dynamically from the Location collection ─────
// Legacy exports kept so that any other files importing them don't break.
export const PICKUP_LOCATIONS: readonly string[] = [];
export const PICKUP_PRICES: Record<string, number> = {};
export const getPickupPrice = (_location: string): number => 0; // no longer used — see resolvePickupFare()

// ─── Main booking transaction ─────────────────────────────────────────────────
interface BookingParams {
  studentName: string;
  studentPhone: string;
  studentId?: string;
  pickupLocation: string;
  pickupAddress: string;
  dropoffLocation: string;
  tripId: string;
  paymentScreenshot: string;
  seatCount?: number;   // defaults to 1
}

export const processBookingTransaction = async (params: BookingParams) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      studentName, studentPhone, studentId, pickupLocation, pickupAddress, dropoffLocation,
      tripId, paymentScreenshot,
    } = params;
    const seatCount = Math.max(1, Math.min(params.seatCount ?? 1, 10));

    // 1. Validate pickup location against DB (dynamic)
    const pickupDoc = await Location.findOne({ name: pickupLocation, type: 'pickup' }).session(session);
    if (!pickupDoc) {
      throw new AppError(
        `Invalid pickup location: "${pickupLocation}". Please select a valid pickup area.`,
        400,
      );
    }
    if (!pickupDoc.isActive) {
      throw new AppError(`The pickup location "${pickupLocation}" is currently unavailable.`, 400);
    }

    const pricePerSeat = pickupDoc.fare;
    const amount       = pricePerSeat * seatCount;

    // 2. Verify trip is bookable
    const trip = await Trip.findById(tripId).session(session);
    if (!trip) throw new AppError('Trip not found', 404);

    if (trip.status === 'Cancelled' || trip.status === 'Completed') {
      throw new AppError(`Cannot book a ${trip.status.toLowerCase()} trip`, 400);
    }

    const availableOnTrip = trip.totalCapacity - trip.totalBooked;
    if (availableOnTrip < seatCount) {
      throw new AppError(
        seatCount === 1
          ? 'This trip is fully booked'
          : `Only ${availableOnTrip} seat(s) remaining on this trip`,
        400,
      );
    }

    // 3. Smart single-vehicle reservation
    const vehicles = await Vehicle.find({ _id: { $in: trip.vehicleIds } }).session(session);
    if (!vehicles.length) throw new AppError('No vehicles assigned to this trip', 400);

    // Fetch active bookings for this trip to calculate free seats
    const activeBookings = await Booking.find({
      tripId,
      status: { $in: ['Pending', 'Confirmed'] }
    }).session(session);

    // Build a map of taken seats per vehicle
    const takenSeats = new Map<string, Set<number>>();
    for (const b of activeBookings) {
      const vIdStr = b.vehicleId.toString();
      if (!takenSeats.has(vIdStr)) takenSeats.set(vIdStr, new Set());
      b.seatNumbers.forEach(s => takenSeats.get(vIdStr)!.add(s));
    }

    // Score vehicles
    const scored = [];
    for (const v of vehicles) {
      const vIdStr = v._id.toString();
      const taken = takenSeats.get(vIdStr) || new Set<number>();
      
      const freeSeats: number[] = [];
      for (let i = 1; i <= v.capacity; i++) {
        if (!taken.has(i)) freeSeats.push(i);
      }

      // Only consider vehicles that have enough seats for the whole group
      if (freeSeats.length < seatCount) continue;

      let samePickupCount = 0;
      for (const b of activeBookings) {
        if (b.vehicleId.toString() === vIdStr && b.pickupLocation === pickupLocation) {
          samePickupCount += b.seatCount;
        }
      }

      scored.push({ vehicle: v, freeSeats, samePickup: samePickupCount });
    }

    if (scored.length === 0) {
      throw new AppError(`Could not find a single vehicle with ${seatCount} consecutive seats available`, 400);
    }

    // Sort by samePickup score (descending)
    scored.sort((a, b) => b.samePickup - a.samePickup);

    // Pick the best vehicle
    const bestVehicleEntry = scored[0];
    const primaryVehicle = bestVehicleEntry.vehicle;
    
    // Select the first `seatCount` free seats
    const seatNumbers = bestVehicleEntry.freeSeats.slice(0, seatCount);

    // 4. Generate reference
    const referenceId = `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // 5. Create booking
    const newBooking = new Booking({
      referenceId,
      studentName,
      studentPhone,
      studentId,
      pickupLocation,
      pickupAddress,
      dropoffLocation,
      tripId,
      vehicleId: primaryVehicle._id,
      seatNumbers,
      seatCount,
      pricePerSeat,
      amount,
      paymentScreenshot,
      status: 'Pending',
    });
    await newBooking.save({ session });

    // 6. Update trip totals
    trip.totalBooked += seatCount;
    trip.totalIncome = (trip.totalIncome || 0) + amount;
    await trip.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { booking: newBooking, vehicle: primaryVehicle, trip };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
