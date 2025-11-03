// pages/api/alerts/upload-sound.ts
import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { uploadAudioToCloudinary } from '@/lib/cloudinary';

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
      maxFileSize: 5 * 1024 * 1024, // 5MB for sounds
    });

    const [fields, files] = await form.parse(req);

    const file = files.file?.[0];
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res
        .status(400)
        .json({
          error: 'Invalid file type. Only MP3, WAV, and OGG are allowed.',
        });
    }

    // Upload to Cloudinary as audio
    const result = await uploadAudioToCloudinary(file.filepath, 'alert-sounds');

    return res.status(200).json({
      success: true,
      soundUrl: result.url,
      publicId: result.public_id,
    });
  } catch (error: any) {
    console.error('Error uploading alert sound:', error);
    return res
      .status(500)
      .json({ error: error.message || 'Failed to upload sound' });
  }
}
