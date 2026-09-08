"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectBooking = exports.confirmBooking = exports.getBookings = exports.createBooking = void 0;
const bookingService_1 = require("../services/bookingService");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
const pusher_1 = require("../pusher");
const Booking_1 = require("../models/Booking");
const Trip_1 = require("../models/Trip");
const mongoose_1 = __importDefault(require("mongoose"));
// ─── Create Booking (multipart/form-data) ────────────────────────────────────
const createBooking = async (req, res, next) => {
    const { studentName, studentPhone, pickupLocation, pickupAddress, dropoffLocation, tripId, seatCount, studentId } = req.body;
    if (!studentName || !studentPhone || !pickupLocation || !pickupAddress || !dropoffLocation || !tripId) {
        return next(new errorHandler_1.AppError('Please provide all required booking fields', 400));
    }
    if (!req.file) {
        return next(new errorHandler_1.AppError('Payment screenshot is required', 400));
    }
    const result = await (0, bookingService_1.processBookingTransaction)({
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
    const pusher = (0, pusher_1.getPusher)();
    pusher.trigger(`trip_${tripId}`, 'seat_booked', {
        tripId: result.trip._id,
        vehicleId: result.vehicle._id,
        seatNumbers: result.booking.seatNumbers,
        totalBooked: result.trip.totalBooked,
        occupancyPercentage: result.trip.occupancyPercentage,
    });
    (0, responseFormatter_1.sendResponse)(res, 201, true, 'Booking submitted — awaiting payment confirmation', result.booking);
};
exports.createBooking = createBooking;
// ─── Get Bookings ─────────────────────────────────────────────────────────────
const getBookings = async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.tripId)
        filter.tripId = req.query.tripId;
    if (req.query.status)
        filter.status = req.query.status;
    if (req.query.search) {
        const re = new RegExp(req.query.search, 'i');
        filter.$or = [
            { studentName: re },
            { studentPhone: re },
            { referenceId: re },
        ];
    }
    const [bookings, total] = await Promise.all([
        Booking_1.Booking.find(filter)
            .populate('tripId', 'route date departureTime')
            .populate('vehicleId', 'vehicleNumber driverName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Booking_1.Booking.countDocuments(filter),
    ]);
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Bookings retrieved', bookings, {
        page, limit, total, pages: Math.ceil(total / limit),
    });
};
exports.getBookings = getBookings;
// ─── Confirm Booking ──────────────────────────────────────────────────────────
const confirmBooking = async (req, res, next) => {
    const booking = await Booking_1.Booking.findById(req.params.id);
    if (!booking)
        return next(new errorHandler_1.AppError('Booking not found', 404));
    if (booking.status !== 'Pending') {
        return next(new errorHandler_1.AppError(`Booking is already ${booking.status.toLowerCase()}`, 400));
    }
    booking.status = 'Confirmed';
    booking.confirmedBy = req.user._id;
    booking.confirmedAt = new Date();
    await booking.save();
    try {
        const pusher = (0, pusher_1.getPusher)();
        pusher.trigger(`booking_${booking._id}`, 'booking_status_updated', {
            bookingId: booking._id,
            status: 'Confirmed',
            referenceId: booking.referenceId,
        });
    }
    catch (_) { }
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Booking confirmed', booking);
};
exports.confirmBooking = confirmBooking;
// ─── Reject Booking ───────────────────────────────────────────────────────────
const rejectBooking = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const booking = await Booking_1.Booking.findById(req.params.id).session(session);
        if (!booking)
            throw new errorHandler_1.AppError('Booking not found', 404);
        if (booking.status === 'Cancelled') {
            throw new errorHandler_1.AppError('Booking is already cancelled', 400);
        }
        // Removed: Release seats logic is no longer needed since seats are calculated dynamically from bookings
        // Decrement trip counter and income
        const trip = await Trip_1.Trip.findById(booking.tripId).session(session);
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
            const pusher = (0, pusher_1.getPusher)();
            pusher.trigger(`booking_${booking._id}`, 'booking_status_updated', {
                bookingId: booking._id,
                status: 'Cancelled',
                referenceId: booking.referenceId,
            });
        }
        catch (_) { }
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Booking rejected and seats released', booking);
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        next(err);
    }
};
exports.rejectBooking = rejectBooking;
