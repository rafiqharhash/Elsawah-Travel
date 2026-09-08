"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishTrip = exports.cancelTrip = exports.deleteTrip = exports.updateTrip = exports.createTrip = exports.getTrip = exports.getTrips = void 0;
const Trip_1 = require("../models/Trip");
const Vehicle_1 = require("../models/Vehicle");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get all trips
// @route   GET /api/v1/trips
const getTrips = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.status) {
            const statusStr = req.query.status;
            if (statusStr.includes(',')) {
                query.status = { $in: statusStr.split(',') };
            }
            else {
                query.status = statusStr;
            }
        }
        if (req.query.search) {
            query.route = { $regex: req.query.search, $options: 'i' };
        }
        const trips = await Trip_1.Trip.find(query)
            .populate('vehicleIds', 'vehicleNumber driverName capacity bookedSeats')
            .skip(skip)
            .limit(limit)
            .sort({ date: 1, departureTime: 1 });
        const total = await Trip_1.Trip.countDocuments(query);
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Trips retrieved successfully', trips, {
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrips = getTrips;
// @desc    Get single trip with vehicles
// @route   GET /api/v1/trips/:id
const getTrip = async (req, res, next) => {
    try {
        const trip = await Trip_1.Trip.findById(req.params.id)
            .populate('vehicleIds', 'vehicleNumber driverName capacity bookedSeats seats');
        if (!trip) {
            return next(new errorHandler_1.AppError('Trip not found', 404));
        }
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Trip retrieved successfully', trip);
    }
    catch (error) {
        next(error);
    }
};
exports.getTrip = getTrip;
// @desc    Create new trip and assign selected vehicles from fleet
// @route   POST /api/v1/trips
// @access  Private (Admin)
const createTrip = async (req, res, next) => {
    try {
        const { route, date, departureTime, vehicleIds = [], locationTimes = [] } = req.body;
        if (!route || !date || !departureTime) {
            return next(new errorHandler_1.AppError('Please provide route, date, and departureTime', 400));
        }
        // Validate that all provided vehicles exist
        let totalCapacity = 0;
        if (vehicleIds.length > 0) {
            const vehicles = await Vehicle_1.Vehicle.find({ _id: { $in: vehicleIds } });
            if (vehicles.length !== vehicleIds.length) {
                return next(new errorHandler_1.AppError('One or more vehicle IDs are invalid', 400));
            }
            totalCapacity = vehicles.reduce((sum, v) => sum + v.capacity, 0);
        }
        // Create the trip
        const trip = await Trip_1.Trip.create({
            route,
            date,
            departureTime,
            vehicleIds,
            locationTimes,
            totalCapacity,
        });
        // (Removed) We no longer assign tripId to Vehicle since a vehicle can be assigned to multiple trips
        const populatedTrip = await Trip_1.Trip.findById(trip._id).populate('vehicleIds', 'vehicleNumber driverName capacity');
        (0, responseFormatter_1.sendResponse)(res, 201, true, 'Trip created and vehicles assigned', populatedTrip);
    }
    catch (error) {
        next(error);
    }
};
exports.createTrip = createTrip;
// @desc    Update trip info and reassign vehicles
// @route   PUT /api/v1/trips/:id
// @access  Private (Admin)
const updateTrip = async (req, res, next) => {
    try {
        const { route, date, departureTime, status, vehicleIds, locationTimes } = req.body;
        const trip = await Trip_1.Trip.findById(req.params.id);
        if (!trip) {
            return next(new errorHandler_1.AppError('Trip not found', 404));
        }
        // Handle vehicle reassignment if vehicleIds provided
        if (vehicleIds !== undefined) {
            const newVehicleIds = vehicleIds;
            // Recalculate total capacity
            const allVehicles = await Vehicle_1.Vehicle.find({ _id: { $in: newVehicleIds } });
            trip.totalCapacity = allVehicles.reduce((sum, v) => sum + v.capacity, 0);
            trip.vehicleIds = newVehicleIds;
        }
        if (route !== undefined)
            trip.route = route;
        if (date !== undefined)
            trip.date = date;
        if (departureTime !== undefined)
            trip.departureTime = departureTime;
        if (status !== undefined)
            trip.status = status;
        if (locationTimes !== undefined)
            trip.locationTimes = locationTimes;
        await trip.save();
        const populatedTrip = await Trip_1.Trip.findById(trip._id).populate('vehicleIds', 'vehicleNumber driverName capacity bookedSeats');
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Trip updated successfully', populatedTrip);
    }
    catch (error) {
        next(error);
    }
};
exports.updateTrip = updateTrip;
// @desc    Delete trip and unassign its vehicles (only if no bookings)
// @route   DELETE /api/v1/trips/:id
// @access  Private (Admin + Supervisor)
const deleteTrip = async (req, res, next) => {
    try {
        const trip = await Trip_1.Trip.findById(req.params.id);
        if (!trip) {
            return next(new errorHandler_1.AppError('Trip not found', 404));
        }
        const user = req.user;
        const isSupervisor = user?.role === 'Supervisor';
        // Admins cannot delete trips that have bookings — Supervisors bypass this check via /cancel
        if (!isSupervisor && trip.totalBooked > 0) {
            return next(new errorHandler_1.AppError('Cannot delete a trip with active bookings', 400));
        }
        // If Supervisor is deleting a trip that has bookings, cascade-cancel them first
        if (isSupervisor && trip.totalBooked > 0) {
            await forceCancelTrip(trip._id.toString());
            return (0, responseFormatter_1.sendResponse)(res, 200, true, 'Trip cancelled — all bookings cancelled and vehicles released', null);
        }
        // (Removed) Unassign vehicles back to the fleet
        await trip.deleteOne();
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Trip deleted and vehicles returned to fleet', null);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteTrip = deleteTrip;
// @desc    Force-cancel a trip with bookings (cascade)
// @route   PATCH /api/v1/trips/:id/cancel
// @access  Private (Supervisor only)
const cancelTrip = async (req, res, next) => {
    try {
        const trip = await Trip_1.Trip.findById(req.params.id);
        if (!trip)
            return next(new errorHandler_1.AppError('Trip not found', 404));
        if (trip.status === 'Cancelled') {
            return next(new errorHandler_1.AppError('Trip is already cancelled', 400));
        }
        const { cancelledCount, vehiclesReleased } = await forceCancelTrip(trip._id.toString());
        (0, responseFormatter_1.sendResponse)(res, 200, true, `Trip cancelled. ${cancelledCount} booking(s) cancelled, ${vehiclesReleased} vehicle(s) released.`, { cancelledCount, vehiclesReleased });
    }
    catch (error) {
        next(error);
    }
};
exports.cancelTrip = cancelTrip;
// ── Internal helper ──────────────────────────────────────────────────────────
async function forceCancelTrip(tripId) {
    const { Booking } = await Promise.resolve().then(() => __importStar(require('../models/Booking')));
    const mongoose = await Promise.resolve().then(() => __importStar(require('mongoose')));
    const session = await mongoose.default.startSession();
    session.startTransaction();
    try {
        const trip = await Trip_1.Trip.findById(tripId).session(session);
        if (!trip)
            throw new Error('Trip not found');
        // 1. Cancel all Pending/Confirmed bookings for this trip
        const result = await Booking.updateMany({ tripId, status: { $in: ['Pending', 'Confirmed'] } }, { $set: { status: 'Cancelled' } }, { session });
        const cancelledCount = result.modifiedCount;
        // 2. Release all assigned vehicles
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
    }
    catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}
// @desc    Publish / unpublish a trip sheet (makes it visible to students)
// @route   PATCH /api/v1/trips/:id/publish
// @access  Private (Admin / Supervisor)
const publishTrip = async (req, res, next) => {
    try {
        const trip = await Trip_1.Trip.findById(req.params.id);
        if (!trip)
            return next(new errorHandler_1.AppError('Trip not found', 404));
        // Toggle — or accept explicit value from body
        const newValue = req.body.isPublished !== undefined
            ? Boolean(req.body.isPublished)
            : !trip.isPublished;
        trip.isPublished = newValue;
        await trip.save();
        (0, responseFormatter_1.sendResponse)(res, 200, true, newValue ? 'Trip sheet published — students can now view their seat assignments' : 'Trip sheet unpublished', { isPublished: trip.isPublished });
    }
    catch (error) {
        next(error);
    }
};
exports.publishTrip = publishTrip;
