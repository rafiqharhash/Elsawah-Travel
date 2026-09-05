import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import { buildApp } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';
import { logger } from './utils/logger';
import { startTripScheduler } from './jobs/tripScheduler';

const startServer = async () => {
  await connectDB();

  const app = buildApp();
  const httpServer = createServer(app);

  // Start Background Jobs
  startTripScheduler();

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err: any) => {
    logger.error(`Error: ${err.message}`);
    httpServer.close(() => process.exit(1));
  });
};

startServer();
