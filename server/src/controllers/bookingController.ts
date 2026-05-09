import { Request, Response, NextFunction } from 'express';
import { processBookingTransaction } from '../services/bookingService';
import { sendResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';
import { getIO } from '../socket';
import { Booking } from '../models/Booking';
import { Vehicle } from '../models/Vehicle';
import { Trip } from '../models/Trip';
import mongoose from 'mongoose';

// ─── Create Booking (multipart/form-data) ────────────────────────────────────
export const createBooking = async (req: Request, res: Response, next: NextFunction) => {
  const { studentName, studentPhone, pickupLocation, pickupAddress, dropoffLocation, tripId, seatCount, studentId } = req.body;

  if (!studentName || !studentPhone || !pickupLocation || !pickupAddress || !dropoffLocation || !tripId) {
    return next(new AppError('Please provide all required booking fields', 400));
  }

  if (!req.file) {
    return next(new AppError('Payment screenshot is required', 400));
  }

  const result = await processBookingTransaction({
    studentName,
    studentPhone,
    pickupLocation,
    pickupAddress,
    dropoffLocation,
    tripId,
    paymentScreenshot: req.file.filename,
    seatCount: seatCount ? parseInt(seatCount, 10) : 1,
    studentId,
  });

  // Notify trip room subscribers
  const io = getIO();
  io.to(`trip_${tripId}`).emit('seat_booked', {
    tripId: result.trip._id,
    vehicleId: result.vehicle._id,
    seatNumbers: result.booking.seatNumbers,
    totalBooked: result.trip.totalBooked,
    occupancyPercentage: result.trip.occupancyPercentage,
  });

  sendResponse(res, 201, true, 'Booking submitted — awaiting payment confirmation', result.booking);
};

// ─── Get Bookings ─────────────────────────────────────────────────────────────
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  const page  = parseInt(req.query.page  as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip  = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.tripId) filter.tripId = req.query.tripId;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const re = new RegExp(req.query.search as string, 'i');
    filter.$or = [
      { studentName: re },
      { studentPhone: re },
      { referenceId: re },
    ];
  }

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('tripId',    'route date departureTime')
      .populate('vehicleId', 'vehicleNumber driverName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter),
  ]);

  sendResponse(res, 200, true, 'Bookings retrieved', bookings, {
    page, limit, total, pages: Math.ceil(total / limit),
  });
};

// ─── Confirm Booking ──────────────────────────────────────────────────────────
export const confirmBooking = async (req: Request, res: Response, next: NextFunction) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.status !== 'Pending') {
    return next(new AppError(`Booking is already ${booking.status.toLowerCase()}`, 400));
  }

  booking.status      = 'Confirmed';
  booking.confirmedBy = (req as any).user._id;
  booking.confirmedAt = new Date();
  await booking.save();

  try {
    const io = getIO();
    io.to(`booking_${booking._id}`).emit('booking_status_updated', {
      bookingId: booking._id,
      status: 'Confirmed',
      referenceId: booking.referenceId,
    });
  } catch (_) {}

  sendResponse(res, 200, true, 'Booking confirmed', booking);
};

// ─── Reject Booking ───────────────────────────────────────────────────────────
export const rejectBooking = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) throw new AppError('Booking not found', 404);
    if (booking.status === 'Cancelled') {
      throw new AppError('Booking is already cancelled', 400);
    }

    // Removed: Release seats logic is no longer needed since seats are calculated dynamically from bookings
    
    // Decrement trip counter and income
    const trip = await Trip.findById(booking.tripId).session(session);
    if (trip) {
      trip.totalBooked = Math.max(0, trip.totalBooked - booking.seatCount);
      trip.totalIncome = Math.max(0, (trip.totalIncome || 0) - booking.amount);
      await trip.save({ session });
    }

    booking.status = 'Cancelled';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    try {
      const io = getIO();
      io.to(`booking_${booking._id}`).emit('booking_status_updated', {
        bookingId: booking._id,
        status: 'Cancelled',
        referenceId: booking.referenceId,
      });
    } catch (_) {}

    sendResponse(res, 200, true, 'Booking rejected and seats released', booking);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};
