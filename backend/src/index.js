"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const http_1 = require("http");
const app_1 = require("./app");
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const logger_1 = require("./utils/logger");
const tripScheduler_1 = require("./jobs/tripScheduler");
const startServer = async () => {
    await (0, db_1.connectDB)();
    const app = (0, app_1.buildApp)();
    const httpServer = (0, http_1.createServer)(app);
    // Start Background Jobs
    (0, tripScheduler_1.startTripScheduler)();
    httpServer.listen(env_1.env.PORT, () => {
        logger_1.logger.info(`Server running in ${env_1.env.NODE_ENV} mode on port ${env_1.env.PORT}`);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        logger_1.logger.error(`Error: ${err.message}`);
        httpServer.close(() => process.exit(1));
    });
};
startServer();
