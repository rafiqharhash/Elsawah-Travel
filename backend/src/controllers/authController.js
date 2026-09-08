"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const User_1 = require("../models/User");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const responseFormatter_1 = require("../utils/responseFormatter");
const errorHandler_1 = require("../middleware/errorHandler");
const logger_1 = require("../utils/logger");
const signToken = (id) => {
    return jsonwebtoken_1.default.sign({ id }, env_1.env.JWT_SECRET, {
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    });
};
const register = async (req, res, next) => {
    const { name, email, phone, password, role } = req.body;
    const existingUser = await User_1.User.findOne({ phone });
    if (existingUser) {
        return next(new errorHandler_1.AppError('Phone number already registered', 400));
    }
    const user = await User_1.User.create({
        name,
        email,
        phone,
        password,
        role: role || 'Student',
    });
    const token = signToken(user._id.toString());
    (0, responseFormatter_1.sendResponse)(res, 201, true, 'User registered successfully', {
        token,
        user: {
            id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
        },
    });
};
exports.register = register;
const login = async (req, res, next) => {
    // Support login via username or phone for Admins/Supervisors
    const { username, password } = req.body;
    if (!username || !password) {
        return next(new errorHandler_1.AppError('Please provide a username/phone and password', 400));
    }
    // Explicitly select password since it is hidden by default in schema
    const user = await User_1.User.findOne({
        $or: [
            { username: username.toLowerCase().trim() },
            { phone: username.trim() }
        ]
    }).select('+password');
    logger_1.logger.debug(`Login attempt for identifier: "${username}"`);
    if (!user || !user.password || !(await user.comparePassword(password))) {
        logger_1.logger.debug(`Login failed for identifier: "${username}"`);
        return next(new errorHandler_1.AppError('Incorrect credentials', 401));
    }
    if (!user.isActive) {
        return next(new errorHandler_1.AppError('This account has been deactivated', 403));
    }
    const token = signToken(user._id.toString());
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'Logged in successfully', {
        token,
        user: {
            id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
        },
    });
};
exports.login = login;
const getMe = async (req, res, next) => {
    const user = req.user;
    (0, responseFormatter_1.sendResponse)(res, 200, true, 'User details retrieved', user);
};
exports.getMe = getMe;
