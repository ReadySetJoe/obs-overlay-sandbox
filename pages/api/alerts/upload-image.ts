// pages/api/alerts/upload-image.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { uploadToCloudinary } from '@/lib/cloudinary';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB for images/gifs
    });

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res
        .status(400)
        .json({
          error: 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.',
        });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.filepath, 'alert-images');

    return res.status(200).json({
      success: true,
      imageUrl: result.url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error: any) {
    console.error('Error uploading alert image:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to upload image' });
  }
}
