import { Request, Response, NextFunction } from 'express';
import { Trip } from '../models/Trip';
import { Vehicle } from '../models/Vehicle';
import { sendResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all trips
// @route   GET /api/v1/trips
export const getTrips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.status) {
      const statusStr = req.query.status as string;
      if (statusStr.includes(',')) {
        query.status = { $in: statusStr.split(',') };
      } else {
        query.status = statusStr;
      }
    }
    if (req.query.search) {
      query.route = { $regex: req.query.search, $options: 'i' };
    }

    const trips = await Trip.find(query)
      .populate('vehicleIds', 'vehicleNumber driverName capacity bookedSeats')
      .skip(skip)
      .limit(limit)
      .sort({ date: 1, departureTime: 1 });

    const total = await Trip.countDocuments(query);

    sendResponse(res, 200, true, 'Trips retrieved successfully', trips, {
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single trip with vehicles
// @route   GET /api/v1/trips/:id
export const getTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicleIds', 'vehicleNumber driverName capacity bookedSeats seats');

    if (!trip) {
      return next(new AppError('Trip not found', 404));
    }

    sendResponse(res, 200, true, 'Trip retrieved successfully', trip);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new trip and assign selected vehicles from fleet
// @route   POST /api/v1/trips
// @access  Private (Admin)
export const createTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { route, date, departureTime, vehicleIds = [], locationTimes = [] } = req.body;

    if (!route || !date || !departureTime) {
      return next(new AppError('Please provide route, date, and departureTime', 400));
    }

    // Validate that all provided vehicles exist
    let totalCapacity = 0;
    if (vehicleIds.length > 0) {
      const vehicles = await Vehicle.find({ _id: { $in: vehicleIds } });

      if (vehicles.length !== vehicleIds.length) {
        return next(new AppError('One or more vehicle IDs are invalid', 400));
      }

      totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
    }

    // Create the trip
    const trip = await Trip.create({
      route,
      date,
      departureTime,
      vehicleIds,
      locationTimes,
      totalCapacity,
    });

    // (Removed) We no longer assign tripId to Vehicle since a vehicle can be assigned to multiple trips

    const populatedTrip = await Trip.findById(trip._id).populate('vehicleIds', 'vehicleNumber driverName capacity');

    sendResponse(res, 201, true, 'Trip created and vehicles assigned', populatedTrip);
  } catch (error) {
    next(error);
  }
};

// @desc    Update trip info and reassign vehicles
// @route   PUT /api/v1/trips/:id
// @access  Private (Admin)
export const updateTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { route, date, departureTime, status, vehicleIds, locationTimes } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return next(new AppError('Trip not found', 404));
    }

    // Handle vehicle reassignment if vehicleIds provided
    if (vehicleIds !== undefined) {
      const newVehicleIds: string[] = vehicleIds;
      // Recalculate total capacity
      const allVehicles = await Vehicle.find({ _id: { $in: newVehicleIds } });
      trip.totalCapacity = allVehicles.reduce((sum, v) => sum + v.capacity, 0);
      trip.vehicleIds = newVehicleIds as any;
    }

    if (route !== undefined) trip.route = route;
    if (date !== undefined) trip.date = date;
    if (departureTime !== undefined) trip.departureTime = departureTime;
    if (status !== undefined) trip.status = status;
    if (locationTimes !== undefined) trip.locationTimes = locationTimes;

    await trip.save();

    const populatedTrip = await Trip.findById(trip._id).populate('vehicleIds', 'vehicleNumber driverName capacity bookedSeats');

    sendResponse(res, 200, true, 'Trip updated successfully', populatedTrip);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete trip and unassign its vehicles (only if no bookings)
// @route   DELETE /api/v1/trips/:id
// @access  Private (Admin + Supervisor)
export const deleteTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return next(new AppError('Trip not found', 404));
    }

    const user = (req as any).user;
    const isSupervisor = user?.role === 'Supervisor';

    // Admins cannot delete trips that have bookings — Supervisors bypass this check via /cancel
    if (!isSupervisor && trip.totalBooked > 0) {
      return next(new AppError('Cannot delete a trip with active bookings', 400));
    }

    // If Supervisor is deleting a trip that has bookings, cascade-cancel them first
    if (isSupervisor && trip.totalBooked > 0) {
      await forceCancelTrip(trip._id.toString());
      return sendResponse(res, 200, true, 'Trip cancelled — all bookings cancelled and vehicles released', null);
    }

    // (Removed) Unassign vehicles back to the fleet

    await trip.deleteOne();
    sendResponse(res, 200, true, 'Trip deleted and vehicles returned to fleet', null);
  } catch (error) {
    next(error);
  }
};

// @desc    Force-cancel a trip with bookings (cascade)
// @route   PATCH /api/v1/trips/:id/cancel
// @access  Private (Supervisor only)
export const cancelTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) return next(new AppError('Trip not found', 404));

    if (trip.status === 'Cancelled') {
      return next(new AppError('Trip is already cancelled', 400));
    }

    const { cancelledCount, vehiclesReleased } = await forceCancelTrip(trip._id.toString());

    sendResponse(res, 200, true,
      `Trip cancelled. ${cancelledCount} booking(s) cancelled, ${vehiclesReleased} vehicle(s) released.`,
      { cancelledCount, vehiclesReleased }
    );
  } catch (error) {
    next(error);
  }
};

// ── Internal helper ──────────────────────────────────────────────────────────
async function forceCancelTrip(tripId: string) {
  const { Booking } = await import('../models/Booking');
  const mongoose = await import('mongoose');

  const session = await mongoose.default.startSession();
  session.startTransaction();

  try {
    const trip = await Trip.findById(tripId).session(session);
    if (!trip) throw new Error('Trip not found');

    // 1. Cancel all Pending/Confirmed bookings for this trip
    const result = await Booking.updateMany(
      { tripId, status: { $in: ['Pending', 'Confirmed'] } },
      { $set: { status: 'Cancelled' } },
      { session }
    );
    const cancelledCount = result.modifiedCount;

    // 2. Release all assigned vehicles
    // We no longer need to clear vehicle seats because seat state is derived dynamically from bookings.
    // However, if we want the trip to no longer claim these vehicles, we clear trip.vehicleIds below.
    // But since trips can be tracked historically, we will keep vehicleIds on the trip!
    // Just setting trip.status = Cancelled is enough to free them up, but since multiple trips can assign the same vehicle now, vehicles are ALWAYS "free".
    const vehiclesReleased = trip.vehicleIds.length;

    // 3. Mark trip as Cancelled
    trip.status = 'Cancelled';
    trip.totalBooked = 0;
    trip.totalIncome = 0;
    trip.vehicleIds = [];
    await trip.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { cancelledCount, vehiclesReleased };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

