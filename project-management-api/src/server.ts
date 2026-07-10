import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables (prefer .env.local for local overrides)
const envPath = fs.existsSync(path.join(process.cwd(), '.env.local'))
  ? path.join(process.cwd(), '.env.local')
  : path.join(process.cwd(), '.env');

dotenv.config({ path: envPath });

import app from './app';
import connectDB from './config/db';
import logger from './config/logger';

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Start Server
const server = app.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack || '');
  logger.warn('Shutting down server...');
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  logger.error(`Unhandled Rejection: ${reason}`);
  logger.warn('Shutting down server gracefully...');
  server.close(() => {
    process.exit(1);
  });
});
