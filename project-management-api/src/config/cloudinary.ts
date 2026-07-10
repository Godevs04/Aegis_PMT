import { v2 as cloudinary } from 'cloudinary';
import logger from './logger';

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration on boot (only log success if credentials are not blank)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  logger.info('Cloudinary SDK configured successfully.');
} else {
  logger.warn('Cloudinary config credentials missing. File uploads will fail.');
}

export default cloudinary;
