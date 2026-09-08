"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
require("express-async-errors"); // Handles async errors without try/catch everywhere
const errorHandler_1 = require("./middleware/errorHandler");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const bookingRoutes_1 = __importDefault(require("./routes/bookingRoutes"));
const exportRoutes_1 = __importDefault(require("./routes/exportRoutes"));
const vehicleRoutes_1 = __importDefault(require("./routes/vehicleRoutes"));
const tripRoutes_1 = __importDefault(require("./routes/tripRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const studentRoutes_1 = __importDefault(require("./routes/studentRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
const locationRoutes_1 = __importDefault(require("./routes/locationRoutes"));
const swagger_1 = require("./config/swagger");
const buildApp = () => {
    const app = (0, express_1.default)();
    // Security & Utility Middlewares
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, cors_1.default)({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use((0, morgan_1.default)('dev'));
    // Serve uploaded payment screenshots statically
    const uploadDir = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : path_1.default.join(process.cwd(), 'uploads');
    app.use('/uploads', express_1.default.static(uploadDir));
    // Rate Limiting
    const limiter = (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: 'Too many requests from this IP, please try again later.',
    });
    app.use('/api', limiter);
    // API Routes (v1)
    app.use('/api/v1/auth', authRoutes_1.default);
    app.use('/api/v1/bookings', bookingRoutes_1.default);
    app.use('/api/v1/export', exportRoutes_1.default);
    app.use('/api/v1/vehicles', vehicleRoutes_1.default);
    app.use('/api/v1/trips', tripRoutes_1.default);
    app.use('/api/v1/users', userRoutes_1.default);
    app.use('/api/v1/students', studentRoutes_1.default);
    app.use('/api/v1/stats', statsRoutes_1.default);
    app.use('/api/v1/locations', locationRoutes_1.default);
    // Swagger Documentation
    (0, swagger_1.setupSwagger)(app);
    // Welcome / API Info
    app.get('/', (req, res) => {
        res.status(200).json({
            message: 'Welcome to Elsawah Travel API',
            version: '1.0.0',
            status: 'Running',
            docs: '/api-docs',
            health: '/health'
        });
    });
    // Health Check
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date() });
    });
    // Centralized Error Handling
    app.use(errorHandler_1.errorHandler);
    return app;
};
exports.buildApp = buildApp;
