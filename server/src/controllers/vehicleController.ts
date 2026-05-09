import { Request, Response, NextFunction } from 'express';
import { Vehicle } from '../models/Vehicle';
import { Trip } from '../models/Trip';
import { sendResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all vehicles (fleet view — shows unassigned and assigned)
// @route   GET /api/v1/vehicles
// @access  Private (Admin/Supervisor)
export const getVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    // (Removed) No more tripId on vehicles
    if (req.query.search) {
      query.$or = [
        { vehicleNumber: { $regex: req.query.search, $options: 'i' } },
        { driverName: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const vehicles = await Vehicle.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Vehicle.countDocuments(query);

    // Attach assigned trips
    const vehicleIds = vehicles.map((v) => v._id);
    const assignedTrips = await Trip.find({
      vehicleIds: { $in: vehicleIds },
      status: { $in: ['Scheduled', 'Active'] }
    }).select('route departureTime vehicleIds status').lean();

    const vehiclesWithTrips = vehicles.map((v) => {
      const vIdStr = v._id.toString();
      const tripsForVehicle = assignedTrips.filter((t) => 
        t.vehicleIds.map((id: any) => id.toString()).includes(vIdStr)
      );
      return { ...v, assignedTrips: tripsForVehicle };
    });

    sendResponse(res, 200, true, 'Vehicles retrieved successfully', vehiclesWithTrips, {
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single vehicle
// @route   GET /api/v1/vehicles/:id
// @access  Private (Admin/Supervisor)
export const getVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }
    sendResponse(res, 200, true, 'Vehicle retrieved successfully', vehicle);
  } catch (error) {
    next(error);
  }
};

// @desc    Create new vehicle (added to fleet, no trip required)
// @route   POST /api/v1/vehicles
// @access  Private (Admin)
export const createVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { vehicleNumber, driverName, driverPhone } = req.body;

    if (!vehicleNumber || !driverName || !driverPhone) {
      return next(new AppError('Please provide vehicle number, driver name, and driver phone', 400));
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      driverName,
      driverPhone,
      capacity: 14,
    });

    sendResponse(res, 201, true, 'Vehicle added to fleet successfully', vehicle);
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError(`A vehicle with plate number "${req.body.vehicleNumber}" already exists.`, 400));
    }
    next(error);
  }
};

// @desc    Update vehicle info
// @route   PUT /api/v1/vehicles/:id
// @access  Private (Admin)
export const updateVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only allow updating basic info, not seat data directly
    const { vehicleNumber, driverName, driverPhone } = req.body;
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { vehicleNumber, driverName, driverPhone },
      { new: true, runValidators: true }
    );

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    sendResponse(res, 200, true, 'Vehicle updated successfully', vehicle);
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError(`A vehicle with that plate number already exists.`, 400));
    }
    next(error);
  }
};

// @desc    Delete vehicle from fleet
// @route   DELETE /api/v1/vehicles/:id
// @access  Private (Admin)
export const deleteVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return next(new AppError('Vehicle not found', 404));
    }

    // Check if the vehicle has active bookings in any trip
    const { Booking } = await import('../models/Booking');
    const activeBookings = await Booking.countDocuments({
      vehicleId: vehicle._id,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    if (activeBookings > 0) {
      return next(new AppError('Cannot delete a vehicle that has active bookings', 400));
    }

    // (Removed) No more tripId on vehicle to check

    await vehicle.deleteOne();

    sendResponse(res, 200, true, 'Vehicle removed from fleet', null);
  } catch (error) {
    next(error);
  }
};
