import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import 'express-async-errors'; // Handles async errors without try/catch everywhere

import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/authRoutes';
import bookingRoutes from './routes/bookingRoutes';

export const buildApp = (): Express => {
  const app = express();

  // Security & Utility Middlewares
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  // Serve uploaded payment screenshots statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api', limiter);

  // API Routes (v1)
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/bookings', bookingRoutes);
  app.use('/api/v1/export', require('./routes/exportRoutes').default);
  app.use('/api/v1/vehicles', require('./routes/vehicleRoutes').default);
  app.use('/api/v1/trips', require('./routes/tripRoutes').default);
  app.use('/api/v1/users', require('./routes/userRoutes').default);
  app.use('/api/v1/students', require('./routes/studentRoutes').default);
  app.use('/api/v1/stats', require('./routes/statsRoutes').default);
  
  // Swagger Documentation
  require('./config/swagger').setupSwagger(app);

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
  app.use(errorHandler);

  return app;
};
