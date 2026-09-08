"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const errorHandler_1 = require("../middleware/errorHandler");
const User_1 = require("../models/User");
const logger_1 = require("../utils/logger");
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await User_1.User.findById(decoded.id).select('-password');
        if (!user || !user.isActive) {
            return next(new errorHandler_1.AppError('The user belonging to this token no longer exists or is inactive.', 401));
        }
        req.user = user;
        next();
    }
    catch (error) {
        return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
    }
};
exports.protect = protect;
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errorHandler_1.AppError('Not authorized to access this route', 401));
        }
        if (!roles.includes(req.user.role)) {
            logger_1.logger.debug(`Authorization failed for user ${req.user._id}. Role: ${req.user.role}, Required: ${roles.join(', ')}`);
            return next(new errorHandler_1.AppError(`User role ${req.user.role} is not authorized to access this route`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
