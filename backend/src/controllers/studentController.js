"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyBookings = exports.updateMyProfile = exports.getMyProfile = exports.loginStudent = exports.registerStudent = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Booking_1 = require("../models/Booking");
const errorHandler_1 = require("../middleware/errorHandler");
const responseFormatter_1 = require("../utils/responseFormatter");
const env_1 = require("../config/env");
// ── Token helper ─────────────────────────────────────────────────────────────
const signToken = (id) => jsonwebtoken_1.default.sign({ id }, env_1.env.JWT_SECRET, { expiresIn: '30d' });
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Register a new student account
// @route POST /api/v1/auth/student/register
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const registerStudent = async (req, res, next) => {
    const { name, email, phone, password, relativePhone } = req.body;
    if (!name || !email || !phone || !password) {
        return next(new errorHandler_1.AppError('Please provide name, email, phone and password', 400));
    }
    const existingByEmail = await User_1.User.findOne({ email: email.toLowerCase() });
    if (existingByEmail) {
        return next(new errorHandler_1.AppError('A user with this email already exists', 409));
    }
    const existingByPhone = await User_1.User.findOne({ phone });
    if (existingByPhone) {
        return next(new errorHandler_1.AppError('A user with this phone number already exists', 409));
    }
    const student = await User_1.User.create({
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
    const studentObj = student.toObject();
    delete studentObj.password;
    (0, responseFormatter_1.sendResponse)(res, 201, true, 'Student account created successfully', { token, student: studentObj });
};
exports.registerStudent = registerStudent;
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Student login
// @route POST /api/v1/auth/student/login
// @access Public
// ─────────────────────────────────────────────────────────────────────────────
const loginStudent = async (req, res, next) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
        return next(new errorHandler_1.AppError('Please provide phone number and password', 400));
    }
    // Need to explicitly select password because it is excluded by default
    const student = await User_1.User.findOne({ phone, role: 'Student' }).select('+password');
    if (!student || !(await student.comparePassword(password))) {
        return next(new errorHandler_1.AppError('Invalid phone number or password', 401));
    }
    if (!student.isActive) {
        return next(new errorHandler_1.AppError('Your account is inactive. Please contact the transport office.', 403));
    }
    const token = signToken(String(student._id));
    const studentObj = student.toObject();
    delete studentObj.password;
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Logged in successfully', { token, student: studentObj });
};
exports.loginStudent = loginStudent;
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get my profile
// @route GET /api/v1/students/me
// @access Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
const getMyProfile = async (req, res, next) => {
    const user = await User_1.User.findById(req.user._id).select('-password');
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Profile retrieved', user);
};
exports.getMyProfile = getMyProfile;
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Update my profile (phone, relativePhone)
// @route PATCH /api/v1/students/me
// @access Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
const updateMyProfile = async (req, res, next) => {
    const allowed = ['phone', 'relativePhone', 'email'];
    const updates = {};
    for (const key of allowed) {
        if (req.body[key] !== undefined)
            updates[key] = req.body[key];
    }
    const updated = await User_1.User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select('-password');
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Profile updated', updated);
};
exports.updateMyProfile = updateMyProfile;
// ─────────────────────────────────────────────────────────────────────────────
// @desc  Get my booking history
// @route GET /api/v1/students/my-bookings
// @access Private (Student)
// ─────────────────────────────────────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
    const me = req.user;
    const bookings = await Booking_1.Booking.find({
        $or: [
            { studentId: me._id },
            { studentPhone: me.phone }, // fallback for bookings made before login existed
        ],
    })
        .populate('tripId', 'route date departureTime status isPublished')
        .populate('vehicleId', 'vehicleNumber driverName driverPhone')
        .sort({ createdAt: -1 });
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Bookings retrieved', bookings);
};
exports.getMyBookings = getMyBookings;
