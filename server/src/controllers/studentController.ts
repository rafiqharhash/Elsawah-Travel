import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Booking } from '../models/Booking';
import { AppError } from '../middleware/errorHandler';
import { sendResponse } from '../utils/responseFormatter';
import { env } from '../config/env';

// ── Token helper ─────────────────────────────────────────────────────────────
const signToken = (id: string) =>
  jwt.sign({ id }, env.JWT_SECRET, { expiresIn: '30d' });

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Register a new student account
// @route POST /api/v1/auth/student/register
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
export const registerStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { name, email, phone, password, relativePhone } = req.body;

  if (!name || !email || !phone || !password) {
    return next(new AppError('Please provide name, email, phone and password', 400));
  }

  const existingByEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingByEmail) {
    return next(new AppError('A user with this email already exists', 409));
  }
  const existingByPhone = await User.findOne({ phone });
  if (existingByPhone) {
    return next(new AppError('A user with this phone number already exists', 409));
  }

  const student = await User.create({
    name,
    email: email.toLowerCase(),
    phone,
    password,
    relativePhone,
    role: 'Student',
    isActive: true,
  });

  const token = signToken(String(student._id));

  // Remove password from output
  const studentObj = student.toObject() as any;
  delete studentObj.password;

  sendResponse(res, 201, true, 'Student account created successfully', { token, student: studentObj });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Student login
// @route POST /api/v1/auth/student/login
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
export const loginStudent = async (req: Request, res: Response, next: NextFunction) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return next(new AppError('Please provide phone number and password', 400));
  }

  // Need to explicitly select password because it is excluded by default
  const student = await User.findOne({ phone, role: 'Student' }).select('+password');

  if (!student || !(await student.comparePassword(password))) {
    return next(new AppError('Invalid phone number or password', 401));
  }

  if (!student.isActive) {
    return next(new AppError('Your account is inactive. Please contact the transport office.', 403));
  }

  const token = signToken(String(student._id));
  const studentObj = student.toObject() as any;
  delete studentObj.password;

  sendResponse(res, 200, true, 'Logged in successfully', { token, student: studentObj });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get my profile
// @route GET /api/v1/students/me
// @access Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  const user = await User.findById((req as any).user._id).select('-password');
  sendResponse(res, 200, true, 'Profile retrieved', user);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update my profile (phone, relativePhone)
// @route PATCH /api/v1/students/me
// @access Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
export const updateMyProfile = async (req: Request, res: Response, next: NextFunction) => {
  const allowed = ['phone', 'relativePhone', 'email'];
  const updates: Record<string, string> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const updated = await User.findByIdAndUpdate(
    (req as any).user._id,
    updates,
    { new: true, runValidators: true },
  ).select('-password');

  sendResponse(res, 200, true, 'Profile updated', updated);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get my booking history
// @route GET /api/v1/students/my-bookings
// @access Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
export const getMyBookings = async (req: Request, res: Response, next: NextFunction) => {
  const me = (req as any).user;

  const bookings = await Booking.find({
    $or: [
      { studentId: me._id },
      { studentPhone: me.phone },   // fallback for bookings made before login existed
    ],
  })
    .populate('tripId',    'route date departureTime status isPublished')
    .populate('vehicleId', 'vehicleNumber driverName driverPhone')
    .sort({ createdAt: -1 });

  sendResponse(res, 200, true, 'Bookings retrieved', bookings);
};
