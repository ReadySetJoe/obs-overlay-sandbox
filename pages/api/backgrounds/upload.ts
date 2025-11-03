// pages/api/backgrounds/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import formidable, { File } from 'formidable';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';
import { extractColorsFromImage } from '@/lib/colorExtraction';
import { getSocketServer } from '../socket';

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Parse form data
    const form = formidable({
      maxFileSize: MAX_FILE_SIZE,
      filter: (part) => {
        return part.mimetype?.startsWith('image/') || false;
      },
    });

    const [fields, files] = await form.parse(req);

    // Get sessionId from form fields
    const sessionId = Array.isArray(fields.sessionId)
      ? fields.sessionId[0]
      : fields.sessionId;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    // Verify user owns this layout
    const layout = await prisma.layout.findUnique({
      where: { sessionId },
    });

    if (!layout || layout.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Get uploaded file
    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = fileArray[0] as File;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.mimetype || '')) {
      return res.status(400).json({
        error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.',
      });
    }

    // Delete old background from Cloudinary if exists
    if (layout.backgroundImagePublicId) {
      try {
        await deleteFromCloudinary(layout.backgroundImagePublicId);
      } catch (error) {
        console.error('Failed to delete old background:', error);
        // Continue anyway - better to upload new than fail
      }
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      file.filepath,
      `overlay-backgrounds/${sessionId}`
    );

    // Extract colors from the image
    let extractedColors;
    try {
      extractedColors = await extractColorsFromImage(uploadResult.url);
    } catch (error) {
      console.error('Color extraction failed:', error);
      // Use default colors if extraction fails
      extractedColors = {
        palette: [
          '#1e3a8a',
          '#581c87',
          '#7c3aed',
          '#164e63',
          '#14b8a6',
          '#7c2d12',
          '#831843',
          '#1f2937',
        ],
        primary: '#1e3a8a',
        secondary: '#581c87',
        accent: '#7c3aed',
      };
    }

    // Update database
    const updatedLayout = await prisma.layout.update({
      where: { sessionId },
      data: {
        backgroundImageUrl: uploadResult.url,
        backgroundImagePublicId: uploadResult.public_id,
        backgroundImageName: file.originalFilename || 'background.png',
        backgroundColors: JSON.stringify(extractedColors),
        backgroundOpacity: 1.0,
        backgroundBlur: 0,
        backgroundUploadedAt: new Date(),
      },
    });

    // Emit socket event to update overlays
    const io = getSocketServer();
    if (io) {
      io.to(sessionId).emit('background-change', {
        backgroundImageUrl: uploadResult.url,
        backgroundOpacity: 1.0,
        backgroundBlur: 0,
      });
    }

    res.status(200).json({
      success: true,
      imageUrl: uploadResult.url,
      colors: extractedColors,
      width: uploadResult.width,
      height: uploadResult.height,
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'File too large. Maximum size is 10MB.' });
    }

    res.status(500).json({
      error: 'Failed to upload background',
      message: error.message,
    });
  }
}
