import multer from 'multer';
import cloudinary from '../config/cloudinary';
import AppError from '../shared/utils/appError';

// Setup memory storage to handle files as buffer streams
const storage = multer.memoryStorage();

// Limit file size to 5MB and accept only image types
export const uploadParser = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image file uploads are allowed.', 400));
    }
  },
});

/**
 * Uploads a buffer stream to Cloudinary.
 * @param fileBuffer Buffer of the uploaded file
 * @param folder Target folder inside Cloudinary
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Failed to upload image to Cloudinary store.', 500));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    // End stream by writing buffer
    uploadStream.end(fileBuffer);
  });
};
