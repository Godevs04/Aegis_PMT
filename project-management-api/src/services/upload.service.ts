import multer from 'multer';
import cloudinary from '../config/cloudinary';
import AppError from '../shared/utils/appError';

// ─── Allowed MIME Types ──────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  // Archives
  'application/zip',
  'application/x-zip-compressed',
  // Text
  'text/plain',
  'text/csv',
];

const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

// ─── Max file size: 25MB ─────────────────────────────────────────────────────
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// ─── Multer Storage (memory buffer) ─────────────────────────────────────────
const storage = multer.memoryStorage();

/**
 * General file upload parser — accepts all allowed file types up to 25MB.
 */
export const fileUploadParser = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type "${file.mimetype}" is not allowed. Accepted: images, PDFs, Word, Excel, ZIP, text.`, 400));
    }
  },
});

/**
 * Image-only upload parser — for avatars, logos, cover images (5MB limit).
 */
export const uploadParser = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Only image file uploads are allowed.', 400));
    }
  },
});

/**
 * Determine Cloudinary resource_type based on MIME type.
 */
function getResourceType(mimeType: string): 'image' | 'raw' | 'video' | 'auto' {
  if (IMAGE_MIME_TYPES.includes(mimeType)) return 'image';
  return 'raw'; // PDFs, docs, ZIPs, text files
}

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param fileBuffer - The file buffer from multer
 * @param folder - Target folder in Cloudinary (e.g., "aegis/workspaces/{id}/attachments")
 * @param mimeType - The file MIME type (determines resource_type)
 * @param originalName - Original filename (used for public_id context)
 * @returns { url, publicId, thumbnailUrl }
 */
export const uploadFileToCloudinary = async (
  fileBuffer: Buffer,
  folder: string,
  mimeType: string,
  originalName?: string
): Promise<{ url: string; publicId: string; thumbnailUrl: string | null }> => {
  const resourceType = getResourceType(mimeType);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        ...(originalName && { filename_override: originalName }),
      },
      (error, result) => {
        if (error || !result) {
          reject(new AppError('Failed to upload file to cloud storage.', 500));
        } else {
          // Generate thumbnail URL for images
          let thumbnailUrl: string | null = null;
          if (resourceType === 'image') {
            thumbnailUrl = cloudinary.url(result.public_id, {
              width: 200,
              height: 200,
              crop: 'fill',
              quality: 'auto',
              format: 'webp',
            });
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            thumbnailUrl,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete a file from Cloudinary by public ID.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  mimeType: string
): Promise<void> => {
  const resourceType = getResourceType(mimeType);

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error(`[Upload] Failed to delete from Cloudinary: ${publicId}`, error);
    // Don't throw — deletion failure shouldn't block the operation
  }
};

/**
 * Legacy function maintained for backward compatibility (avatar uploads).
 */
export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  folder: string
): Promise<string> => {
  const result = await uploadFileToCloudinary(fileBuffer, folder, 'image/png');
  return result.url;
};

export { ALLOWED_MIME_TYPES, IMAGE_MIME_TYPES, MAX_FILE_SIZE };
