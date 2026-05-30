import { Request, Response, NextFunction } from 'express';
import { Location } from '../models/Location';
import { sendResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all locations (public — students fetch on load)
// @route   GET /api/v1/locations
// @access  Public
export const getLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = { isActive: true };
    if (req.query.type) filter.type = req.query.type;

    const locations = await Location.find(filter).sort({ type: 1, name: 1 });
    sendResponse(res, 200, true, 'Locations retrieved', locations);
  } catch (err) {
    next(err);
  }
};

// @desc    Get ALL locations including inactive (admin view)
// @route   GET /api/v1/locations/all
// @access  Private (Admin/Supervisor)
export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.type) filter.type = req.query.type;

    const locations = await Location.find(filter).sort({ type: 1, name: 1 });
    sendResponse(res, 200, true, 'All locations retrieved', locations);
  } catch (err) {
    next(err);
  }
};

// @desc    Create a new location
// @route   POST /api/v1/locations
// @access  Private (Admin/Supervisor)
export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, arabicName, type, fare, isActive } = req.body;

    if (!name || !type) {
      return next(new AppError('Name and type are required', 400));
    }
    if (!['pickup', 'dropoff'].includes(type)) {
      return next(new AppError('Type must be "pickup" or "dropoff"', 400));
    }
    if (type === 'pickup' && (fare === undefined || fare < 0)) {
      return next(new AppError('Pickup locations require a valid fare (≥ 0)', 400));
    }

    const existing = await Location.findOne({ name: name.trim() });
    if (existing) {
      return next(new AppError(`A location named "${name}" already exists`, 409));
    }

    const location = await Location.create({
      name: name.trim(),
      arabicName: arabicName?.trim() || '',
      type,
      fare: type === 'pickup' ? Number(fare) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    sendResponse(res, 201, true, 'Location created', location);
  } catch (err) {
    next(err);
  }
};

// @desc    Update a location
// @route   PUT /api/v1/locations/:id
// @access  Private (Admin/Supervisor)
export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return next(new AppError('Location not found', 404));

    const { name, arabicName, fare, isActive } = req.body;

    if (name !== undefined) location.name = name.trim();
    if (arabicName !== undefined) location.arabicName = arabicName.trim();
    if (fare !== undefined && location.type === 'pickup') location.fare = Number(fare);
    if (isActive !== undefined) location.isActive = Boolean(isActive);

    await location.save();
    sendResponse(res, 200, true, 'Location updated', location);
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a location
// @route   DELETE /api/v1/locations/:id
// @access  Private (Admin/Supervisor)
export const deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.findById(req.params.id);
    if (!location) return next(new AppError('Location not found', 404));

    await location.deleteOne();
    sendResponse(res, 200, true, 'Location deleted', null);
  } catch (err) {
    next(err);
  }
};
