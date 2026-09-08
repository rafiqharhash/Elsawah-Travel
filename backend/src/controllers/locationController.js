"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLocation = exports.updateLocation = exports.createLocation = exports.getAllLocations = exports.getLocations = void 0;
const Location_1 = require("../models/Location");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get all locations (public — students fetch on load)
// @route   GET /api/v1/locations
// @access  Public
const getLocations = async (req, res, next) => {
    try {
        const filter = { isActive: true };
        if (req.query.type)
            filter.type = req.query.type;
        const locations = await Location_1.Location.find(filter).sort({ type: 1, name: 1 });
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Locations retrieved', locations);
    }
    catch (err) {
        next(err);
    }
};
exports.getLocations = getLocations;
// @desc    Get ALL locations including inactive (admin view)
// @route   GET /api/v1/locations/all
// @access  Private (Admin/Supervisor)
const getAllLocations = async (req, res, next) => {
    try {
        const filter = {};
        if (req.query.type)
            filter.type = req.query.type;
        const locations = await Location_1.Location.find(filter).sort({ type: 1, name: 1 });
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'All locations retrieved', locations);
    }
    catch (err) {
        next(err);
    }
};
exports.getAllLocations = getAllLocations;
// @desc    Create a new location
// @route   POST /api/v1/locations
// @access  Private (Admin/Supervisor)
const createLocation = async (req, res, next) => {
    try {
        const { name, arabicName, type, fare, isActive } = req.body;
        if (!name || !type) {
            return next(new errorHandler_1.AppError('Name and type are required', 400));
        }
        if (!['pickup', 'dropoff'].includes(type)) {
            return next(new errorHandler_1.AppError('Type must be "pickup" or "dropoff"', 400));
        }
        if (type === 'pickup' && (fare === undefined || fare < 0)) {
            return next(new errorHandler_1.AppError('Pickup locations require a valid fare (≥ 0)', 400));
        }
        const existing = await Location_1.Location.findOne({ name: name.trim() });
        if (existing) {
            return next(new errorHandler_1.AppError(`A location named "${name}" already exists`, 409));
        }
        const location = await Location_1.Location.create({
            name: name.trim(),
            arabicName: arabicName?.trim() || '',
            type,
            fare: type === 'pickup' ? Number(fare) : 0,
            isActive: isActive !== undefined ? isActive : true,
        });
        (0, responseFormatter_1.sendResponse)(res, 201, true, 'Location created', location);
    }
    catch (err) {
        next(err);
    }
};
exports.createLocation = createLocation;
// @desc    Update a location
// @route   PUT /api/v1/locations/:id
// @access  Private (Admin/Supervisor)
const updateLocation = async (req, res, next) => {
    try {
        const location = await Location_1.Location.findById(req.params.id);
        if (!location)
            return next(new errorHandler_1.AppError('Location not found', 404));
        const { name, arabicName, fare, isActive } = req.body;
        if (name !== undefined)
            location.name = name.trim();
        if (arabicName !== undefined)
            location.arabicName = arabicName.trim();
        if (fare !== undefined && location.type === 'pickup')
            location.fare = Number(fare);
        if (isActive !== undefined)
            location.isActive = Boolean(isActive);
        await location.save();
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Location updated', location);
    }
    catch (err) {
        next(err);
    }
};
exports.updateLocation = updateLocation;
// @desc    Delete a location
// @route   DELETE /api/v1/locations/:id
// @access  Private (Admin/Supervisor)
const deleteLocation = async (req, res, next) => {
    try {
        const location = await Location_1.Location.findById(req.params.id);
        if (!location)
            return next(new errorHandler_1.AppError('Location not found', 404));
        await location.deleteOne();
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Location deleted', null);
    }
    catch (err) {
        next(err);
    }
};
exports.deleteLocation = deleteLocation;
