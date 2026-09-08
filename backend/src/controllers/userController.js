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
exports.updateUser = exports.manualBooking = exports.removeAdmin = exports.createAdmin = exports.getUsers = void 0;
const User_1 = require("../models/User");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
// @desc    Get all users with pagination/filtering
// @route   GET /api/v1/users
// @access  Private (Admin/Supervisor)
const getUsers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const query = {};
        if (req.query.role)
            query.role = req.query.role;
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
                { phone: { $regex: req.query.search, $options: 'i' } },
            ];
        }
        const users = await User_1.User.find(query)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        const total = await User_1.User.countDocuments(query);
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Users retrieved successfully', users, {
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUsers = getUsers;
// @desc    Create new Admin account
// @route   POST /api/v1/users/admins
// @access  Private (Supervisor only)
const createAdmin = async (req, res, next) => {
    try {
        const { name, phone, password, email, username } = req.body;
        if (!name || !phone || !password) {
            return next(new errorHandler_1.AppError('Please provide name, phone, and password', 400));
        }
        const existing = await User_1.User.findOne({ $or: [{ phone }, ...(username ? [{ username }] : [])] });
        if (existing) {
            return next(new errorHandler_1.AppError('A user with this phone or username already exists', 400));
        }
        const admin = await User_1.User.create({
            name,
            phone,
            email: email || undefined,
            username: username?.toLowerCase().trim() || undefined,
            password,
            role: 'Admin',
        });
        (0, responseFormatter_1.sendResponse)(res, 201, true, 'Admin account created successfully', {
            id: admin._id,
            name: admin.name,
            phone: admin.phone,
            username: admin.username,
            role: admin.role,
        });
    }
    catch (error) {
        if (error.code === 11000) {
            return next(new errorHandler_1.AppError('Phone number or username already in use', 400));
        }
        next(error);
    }
};
exports.createAdmin = createAdmin;
// @desc    Deactivate / delete an Admin account
// @route   DELETE /api/v1/users/admins/:id
// @access  Private (Supervisor only)
const removeAdmin = async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        if (user.role === 'Supervisor') {
            return next(new errorHandler_1.AppError('Cannot remove a Supervisor account', 403));
        }
        if (user.role !== 'Admin') {
            return next(new errorHandler_1.AppError('This user is not an Admin', 400));
        }
        await user.deleteOne();
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'Admin account removed successfully', null);
    }
    catch (error) {
        next(error);
    }
};
exports.removeAdmin = removeAdmin;
// @desc    Admin/Supervisor manually books a student on a trip
// @route   POST /api/v1/users/manual-booking
// @access  Private (Admin + Supervisor)
const manualBooking = async (req, res, next) => {
    try {
        const { processBookingTransaction } = await Promise.resolve().then(() => __importStar(require('../services/bookingService')));
        const { getPusher } = await Promise.resolve().then(() => __importStar(require('../pusher')));
        const { Booking } = await Promise.resolve().then(() => __importStar(require('../models/Booking')));
        const { studentName, studentPhone, tripId, pickupLocation, dropoffLocation } = req.body;
        if (!studentName || !studentPhone || !tripId || !pickupLocation) {
            return next(new errorHandler_1.AppError('Please provide studentName, studentPhone, tripId, and pickupLocation', 400));
        }
        const result = await processBookingTransaction({
            studentName,
            studentPhone,
            tripId,
            pickupLocation,
            pickupAddress: 'Admin Manual Booking', // required field
            dropoffLocation: dropoffLocation || 'University Campus',
            paymentScreenshot: 'admin-manual', // admin bypass — no screenshot needed
        });
        // Auto-confirm manual bookings (admin already verified payment)
        result.booking.status = 'Confirmed';
        result.booking.confirmedBy = req.user._id;
        result.booking.confirmedAt = new Date();
        await result.booking.save();
        // Emit real-time update
        try {
            const pusher = getPusher();
            pusher.trigger(`trip_${tripId}`, 'seat_booked', {
                tripId,
                totalBooked: result.trip.totalBooked,
                occupancyPercentage: result.trip.occupancyPercentage,
            });
        }
        catch (_) { }
        (0, responseFormatter_1.sendResponse)(res, 201, true, 'Booking created and confirmed by admin', result.booking);
    }
    catch (error) {
        next(error);
    }
};
exports.manualBooking = manualBooking;
// @desc    Update a user/student profile
// @route   PUT /api/v1/users/:id
// @access  Private (Admin/Supervisor)
const updateUser = async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.params.id);
        if (!user) {
            return next(new errorHandler_1.AppError('User not found', 404));
        }
        // Admins shouldn't be able to edit other Admins or Supervisors, unless it's a Supervisor editing an Admin
        const reqUser = req.user;
        if (user.role !== 'Student') {
            if (reqUser.role !== 'Supervisor') {
                return next(new errorHandler_1.AppError('You are not authorized to edit this user', 403));
            }
        }
        const { name, email, phone, username, password, studentNumber, relativePhone, isActive } = req.body;
        // Check for uniqueness if fields are being changed
        if (studentNumber && studentNumber !== user.studentNumber) {
            const existing = await User_1.User.findOne({ studentNumber });
            if (existing)
                return next(new errorHandler_1.AppError('Student number already in use', 400));
        }
        if (phone && phone !== user.phone) {
            const existing = await User_1.User.findOne({ phone });
            if (existing)
                return next(new errorHandler_1.AppError('Phone number already in use', 400));
        }
        if (email && email !== user.email) {
            const existing = await User_1.User.findOne({ email });
            if (existing)
                return next(new errorHandler_1.AppError('Email already in use', 400));
        }
        if (username && username !== user.username) {
            const existing = await User_1.User.findOne({ username: username.toLowerCase().trim() });
            if (existing)
                return next(new errorHandler_1.AppError('Username already in use', 400));
        }
        if (name)
            user.name = name;
        if (email)
            user.email = email;
        if (phone)
            user.phone = phone;
        if (username)
            user.username = username.toLowerCase().trim();
        if (password)
            user.password = password; // pre-save hook handles hashing
        if (studentNumber)
            user.studentNumber = studentNumber;
        if (relativePhone !== undefined)
            user.relativePhone = relativePhone;
        if (isActive !== undefined)
            user.isActive = isActive;
        await user.save();
        const updatedUser = await User_1.User.findById(req.params.id).select('-password');
        (0, responseFormatter_1.sendResponse)(res, 200, true, 'User profile updated successfully', updatedUser);
    }
    catch (error) {
        next(error);
    }
};
exports.updateUser = updateUser;
