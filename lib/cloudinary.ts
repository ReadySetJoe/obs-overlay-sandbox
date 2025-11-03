// lib/cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

/**
 * Upload image to Cloudinary
 */
export async function uploadToCloudinary(
  filePath: string,
  folder: string = 'overlay-backgrounds'
): Promise<{
  url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'image',
      transformation: [
        {
          width: 1920,
          height: 1080,
          crop: 'limit', // Don't upscale, only downscale if larger
          quality: 'auto:good', // Automatic quality optimization
          fetch_format: 'auto', // Auto-deliver WebP when supported
        },
      ],
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Upload audio file to Cloudinary
 */
export async function uploadAudioToCloudinary(
  filePath: string,
  folder: string = 'alert-sounds'
): Promise<{
  url: string;
  public_id: string;
  format: string;
  duration: number;
}> {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: 'video', // Cloudinary treats audio as video resource type
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      duration: result.duration || 0,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload audio to Cloudinary');
  }
}

/**
 * Delete image from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete ${resourceType} from Cloudinary`);
  }
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    blur?: number;
    opacity?: number;
  } = {}
): string {
  const transformations: any[] = [];

  if (options.width || options.height) {
    transformations.push({
      width: options.width,
      height: options.height,
      crop: 'limit',
    });
  }

  if (options.blur) {
    transformations.push({ effect: `blur:${options.blur * 100}` });
  }

  if (options.opacity !== undefined && options.opacity < 1) {
    transformations.push({ opacity: Math.round(options.opacity * 100) });
  }

  return cloudinary.url(publicId, {
    transformation: transformations,
    secure: true,
    fetch_format: 'auto',
    quality: 'auto:good',
  });
}
