import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import { sendResponse } from '../utils/responseFormatter';
import { AppError } from '../middleware/errorHandler';

// @desc    Get all users with pagination/filtering
// @route   GET /api/v1/users
// @access  Private (Admin/Supervisor)
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (req.query.role) query.role = req.query.role;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    sendResponse(res, 200, true, 'Users retrieved successfully', users, {
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new Admin account
// @route   POST /api/v1/users/admins
// @access  Private (Supervisor only)
export const createAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, password, email, username } = req.body;

    if (!name || !phone || !password) {
      return next(new AppError('Please provide name, phone, and password', 400));
    }

    const existing = await User.findOne({ $or: [{ phone }, ...(username ? [{ username }] : [])] });
    if (existing) {
      return next(new AppError('A user with this phone or username already exists', 400));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await User.create({
      name,
      phone,
      email: email || undefined,
      username: username?.toLowerCase().trim() || undefined,
      password: hashedPassword,
      role: 'Admin',
    });

    sendResponse(res, 201, true, 'Admin account created successfully', {
      id: admin._id,
      name: admin.name,
      phone: admin.phone,
      username: admin.username,
      role: admin.role,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      return next(new AppError('Phone number or username already in use', 400));
    }
    next(error);
  }
};

// @desc    Deactivate / delete an Admin account
// @route   DELETE /api/v1/users/admins/:id
// @access  Private (Supervisor only)
export const removeAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (user.role === 'Supervisor') {
      return next(new AppError('Cannot remove a Supervisor account', 403));
    }

    if (user.role !== 'Admin') {
      return next(new AppError('This user is not an Admin', 400));
    }

    await user.deleteOne();

    sendResponse(res, 200, true, 'Admin account removed successfully', null);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin/Supervisor manually books a student on a trip
// @route   POST /api/v1/users/manual-booking
// @access  Private (Admin + Supervisor)
export const manualBooking = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { processBookingTransaction } = await import('../services/bookingService');
    const { getIO } = await import('../socket');
    const { Booking } = await import('../models/Booking');

    const { studentName, studentPhone, tripId, pickupLocation, pickupAddress, dropoffLocation } = req.body;

    if (!studentName || !studentPhone || !tripId || !pickupLocation) {
      return next(new AppError('Please provide studentName, studentPhone, tripId, and pickupLocation', 400));
    }

    const result = await processBookingTransaction({
      studentName,
      studentPhone,
      tripId,
      pickupLocation,
      pickupAddress: pickupAddress || '',
      dropoffLocation: dropoffLocation || 'University Campus',
      paymentScreenshot: 'admin-manual', // admin bypass — no screenshot needed
    });

    // Auto-confirm manual bookings (admin already verified payment)
    result.booking.status      = 'Confirmed';
    result.booking.confirmedBy = (req as any).user._id;
    result.booking.confirmedAt = new Date();
    await result.booking.save();

    // Emit real-time update
    try {
      const io = getIO();
      io.to(`trip_${tripId}`).emit('seat_booked', {
        tripId,
        totalBooked: result.trip.totalBooked,
        occupancyPercentage: result.trip.occupancyPercentage,
      });
    } catch (_) {}

    sendResponse(res, 201, true, 'Booking created and confirmed by admin', result.booking);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a user/student profile
// @route   PUT /api/v1/users/:id
// @access  Private (Admin/Supervisor)
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Admins shouldn't be able to edit other Admins or Supervisors, unless it's a Supervisor editing an Admin
    const reqUser = (req as any).user;
    if (user.role !== 'Student') {
      if (reqUser.role !== 'Supervisor') {
        return next(new AppError('You are not authorized to edit this user', 403));
      }
    }

    const { name, email, phone, studentNumber, relativePhone, isActive } = req.body;

    // Check for uniqueness if fields are being changed
    if (studentNumber && studentNumber !== user.studentNumber) {
      const existing = await User.findOne({ studentNumber });
      if (existing) return next(new AppError('Student number already in use', 400));
    }
    if (phone && phone !== user.phone) {
      const existing = await User.findOne({ phone });
      if (existing) return next(new AppError('Phone number already in use', 400));
    }
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return next(new AppError('Email already in use', 400));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (studentNumber) user.studentNumber = studentNumber;
    if (relativePhone !== undefined) user.relativePhone = relativePhone;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(req.params.id).select('-password');
    sendResponse(res, 200, true, 'User profile updated successfully', updatedUser);
  } catch (error) {
    next(error);
  }
};

