"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processBookingTransaction = exports.getPickupPrice = exports.PICKUP_PRICES = exports.PICKUP_LOCATIONS = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Vehicle_1 = require("../models/Vehicle");
const Trip_1 = require("../models/Trip");
const Booking_1 = require("../models/Booking");
const Location_1 = require("../models/Location");
const errorHandler_1 = require("../middleware/errorHandler");
// ─── Pickup price is now resolved dynamically from the Location collection ─────
// Legacy exports kept so that any other files importing them don't break.
exports.PICKUP_LOCATIONS = [];
exports.PICKUP_PRICES = {};
const getPickupPrice = (_location) => 0; // no longer used — see resolvePickupFare()
exports.getPickupPrice = getPickupPrice;
const processBookingTransaction = async (params) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { studentName, studentPhone, studentId, pickupLocation, pickupAddress, dropoffLocation, tripId, paymentScreenshot, } = params;
        const seatCount = Math.max(1, Math.min(params.seatCount ?? 1, 10));
        // 1. Validate pickup location against DB (dynamic)
        const pickupDoc = await Location_1.Location.findOne({ name: pickupLocation, type: 'pickup' }).session(session);
        if (!pickupDoc) {
            throw new errorHandler_1.AppError(`Invalid pickup location: "${pickupLocation}". Please select a valid pickup area.`, 400);
        }
        if (!pickupDoc.isActive) {
            throw new errorHandler_1.AppError(`The pickup location "${pickupLocation}" is currently unavailable.`, 400);
        }
        const pricePerSeat = pickupDoc.fare;
        const amount = pricePerSeat * seatCount;
        // 2. Verify trip is bookable
        const trip = await Trip_1.Trip.findById(tripId).session(session);
        if (!trip)
            throw new errorHandler_1.AppError('Trip not found', 404);
        if (trip.status === 'Cancelled' || trip.status === 'Completed') {
            throw new errorHandler_1.AppError(`Cannot book a ${trip.status.toLowerCase()} trip`, 400);
        }
        const availableOnTrip = trip.totalCapacity - trip.totalBooked;
        if (availableOnTrip < seatCount) {
            throw new errorHandler_1.AppError(seatCount === 1
                ? 'This trip is fully booked'
                : `Only ${availableOnTrip} seat(s) remaining on this trip`, 400);
        }
        // 3. Smart single-vehicle reservation
        const vehicles = await Vehicle_1.Vehicle.find({ _id: { $in: trip.vehicleIds } }).session(session);
        if (!vehicles.length)
            throw new errorHandler_1.AppError('No vehicles assigned to this trip', 400);
        // Fetch active bookings for this trip to calculate free seats
        const activeBookings = await Booking_1.Booking.find({
            tripId,
            status: { $in: ['Pending', 'Confirmed'] }
        }).session(session);
        // Build a map of taken seats per vehicle
        const takenSeats = new Map();
        for (const b of activeBookings) {
            const vIdStr = b.vehicleId.toString();
            if (!takenSeats.has(vIdStr))
                takenSeats.set(vIdStr, new Set());
            b.seatNumbers.forEach(s => takenSeats.get(vIdStr).add(s));
        }
        // Score vehicles
        const scored = [];
        for (const v of vehicles) {
            const vIdStr = v._id.toString();
            const taken = takenSeats.get(vIdStr) || new Set();
            const freeSeats = [];
            for (let i = 1; i <= v.capacity; i++) {
                if (!taken.has(i))
                    freeSeats.push(i);
            }
            // Only consider vehicles that have enough seats for the whole group
            if (freeSeats.length < seatCount)
                continue;
            let samePickupCount = 0;
            for (const b of activeBookings) {
                if (b.vehicleId.toString() === vIdStr && b.pickupLocation === pickupLocation) {
                    samePickupCount += b.seatCount;
                }
            }
            scored.push({ vehicle: v, freeSeats, samePickup: samePickupCount });
        }
        if (scored.length === 0) {
            throw new errorHandler_1.AppError(`Could not find a single vehicle with ${seatCount} consecutive seats available`, 400);
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
        const newBooking = new Booking_1.Booking({
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
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.processBookingTransaction = processBookingTransaction;
