"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.errorHandler = void 0;
const logger_1 = require("../utils/logger");
const responseFormatter_1 = require("../utils/responseFormatter");
const zod_1 = require("zod");
const errorHandler = (err, req, res, next) => {
    logger_1.logger.error(`${req.method} ${req.url} - ${err.message}`, { stack: err.stack });
    if (err instanceof zod_1.ZodError) {
        return (0, responseFormatter_1.sendResponse)(res, 400, false, 'Validation Error', null, err.errors);
    }
    if (err.name === 'ValidationError') {
        return (0, responseFormatter_1.sendResponse)(res, 400, false, 'Mongoose Validation Error', null, err.errors);
    }
    if (err.code === 11000) {
        return (0, responseFormatter_1.sendResponse)(res, 409, false, 'Duplicate Key Error', null, err.keyValue);
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    (0, responseFormatter_1.sendResponse)(res, statusCode, false, message);
};
exports.errorHandler = errorHandler;
class AppError extends Error {
    statusCode;
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
