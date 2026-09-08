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
exports.deleteVehicle = exports.updateVehicle = exports.createVehicle = exports.getVehicle = exports.getVehicles = void 0;
const Vehicle_1 = require("../models/Vehicle");
const Trip_1 = require("../models/Trip");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get all vehicles (fleet view — shows unassigned and assigned)
// @route   GET /api/v1/vehicles
// @access  Private (Admin/Supervisor)
const getVehicles = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        // (Removed) No more tripId on vehicles
        if (req.query.search) {
            query.$or = [
                { vehicleNumber: { $regex: req.query.search, $options: 'i' } },
                { driverName: { $regex: req.query.search, $options: 'i' } },
            ];
        }
        const vehicles = await Vehicle_1.Vehicle.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();
        const total = await Vehicle_1.Vehicle.countDocuments(query);
        // Attach assigned trips
        const vehicleIds = vehicles.map((v) => v._id);
        const assignedTrips = await Trip_1.Trip.find({
            vehicleIds: { $in: vehicleIds },
            status: { $in: ['Scheduled', 'Active'] }
        }).select('route departureTime vehicleIds status').lean();
        const vehiclesWithTrips = vehicles.map((v) => {
            const vIdStr = v._id.toString();
            const tripsForVehicle = assignedTrips.filter((t) => t.vehicleIds.map((id) => id.toString()).includes(vIdStr));
            return { ...v, assignedTrips: tripsForVehicle };
        });
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Vehicles retrieved successfully', vehiclesWithTrips, {
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getVehicles = getVehicles;
// @desc    Get single vehicle
// @route   GET /api/v1/vehicles/:id
// @access  Private (Admin/Supervisor)
const getVehicle = async (req, res, next) => {
    try {
        const vehicle = await Vehicle_1.Vehicle.findById(req.params.id);
        if (!vehicle) {
            return next(new errorHandler_1.AppError('Vehicle not found', 404));
        }
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Vehicle retrieved successfully', vehicle);
    }
    catch (error) {
        next(error);
    }
};
exports.getVehicle = getVehicle;
// @desc    Create new vehicle (added to fleet, no trip required)
// @route   POST /api/v1/vehicles
// @access  Private (Admin)
const createVehicle = async (req, res, next) => {
    try {
        const { vehicleNumber, driverName, driverPhone } = req.body;
        if (!vehicleNumber || !driverName || !driverPhone) {
            return next(new errorHandler_1.AppError('Please provide vehicle number, driver name, and driver phone', 400));
        }
        const vehicle = await Vehicle_1.Vehicle.create({
            vehicleNumber,
            driverName,
            driverPhone,
            capacity: 14,
        });
        (0, responseFormatter_1.sendResponse)(res, 201, true, 'Vehicle added to fleet successfully', vehicle);
    }
    catch (error) {
        if (error.code === 11000) {
            return next(new errorHandler_1.AppError(`A vehicle with plate number "${req.body.vehicleNumber}" already exists.`, 400));
        }
        next(error);
    }
};
exports.createVehicle = createVehicle;
// @desc    Update vehicle info
// @route   PUT /api/v1/vehicles/:id
// @access  Private (Admin)
const updateVehicle = async (req, res, next) => {
    try {
        // Only allow updating basic info, not seat data directly
        const { vehicleNumber, driverName, driverPhone } = req.body;
        const vehicle = await Vehicle_1.Vehicle.findByIdAndUpdate(req.params.id, { vehicleNumber, driverName, driverPhone }, { new: true, runValidators: true });
        if (!vehicle) {
            return next(new errorHandler_1.AppError('Vehicle not found', 404));
        }
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Vehicle updated successfully', vehicle);
    }
    catch (error) {
        if (error.code === 11000) {
            return next(new errorHandler_1.AppError(`A vehicle with that plate number already exists.`, 400));
        }
        next(error);
    }
};
exports.updateVehicle = updateVehicle;
// @desc    Delete vehicle from fleet
// @route   DELETE /api/v1/vehicles/:id
// @access  Private (Admin)
const deleteVehicle = async (req, res, next) => {
    try {
        const vehicle = await Vehicle_1.Vehicle.findById(req.params.id);
        if (!vehicle) {
            return next(new errorHandler_1.AppError('Vehicle not found', 404));
        }
        // Check if the vehicle has active bookings in any trip
        const { Booking } = await Promise.resolve().then(() => __importStar(require('../models/Booking')));
        const activeBookings = await Booking.countDocuments({
            vehicleId: vehicle._id,
            status: { $in: ['Pending', 'Confirmed'] }
        });
        if (activeBookings > 0) {
            return next(new errorHandler_1.AppError('Cannot delete a vehicle that has active bookings', 400));
        }
        // (Removed) No more tripId on vehicle to check
        await vehicle.deleteOne();
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Vehicle removed from fleet', null);
    }
    catch (error) {
        next(error);
    }
};
exports.deleteVehicle = deleteVehicle;
