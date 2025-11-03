// pages/api/paint-templates/upload.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import formidable, { File } from 'formidable';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { PaintByNumbersGenerator } from '@/lib/paintByNumbersGenerator';
import fs from 'fs/promises';

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
      filter: part => {
        return part.mimetype?.startsWith('image/') || false;
      },
    });

    const [fields, files] = await form.parse(req);

    // Get form parameters
    const name = (
      Array.isArray(fields.name) ? fields.name[0] : fields.name
    )?.trim();
    const description = Array.isArray(fields.description)
      ? fields.description[0]
      : fields.description;
    const numColors = parseInt(
      (Array.isArray(fields.numColors)
        ? fields.numColors[0]
        : fields.numColors) || '10'
    );
    const maxDimension = parseInt(
      (Array.isArray(fields.maxDimension)
        ? fields.maxDimension[0]
        : fields.maxDimension) || '100'
    );

    if (!name) {
      return res.status(400).json({ error: 'Template name is required' });
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

    // Read file buffer
    const fileBuffer = await fs.readFile(file.filepath);

    // Generate paint-by-numbers template
    console.log('Generating paint-by-numbers template...');
    const generator = new PaintByNumbersGenerator({
      numColors,
      maxDimension,
      drawBorders: false,
      templateName: name,
      templateDescription: description || '',
    });

    const { template, width, height } = await generator.generate(fileBuffer);

    console.log('Template generated successfully');

    // Upload original image to Cloudinary
    const originalUpload = await uploadToCloudinary(
      file.filepath,
      `paint-templates/${session.user.id}`
    );

    // Save to database
    const paintTemplate = await prisma.paintTemplateCustom.create({
      data: {
        userId: session.user.id,
        name: template.name,
        description: template.description,
        width: template.width,
        height: template.height,
        regions: JSON.stringify(template.regions),
        imageUrl: originalUpload.url,
        imagePublicId: originalUpload.public_id,
        thumbnailUrl: null,
      },
    });

    console.log(`Template saved to database with ID: ${paintTemplate.id}`);

    res.status(200).json({
      success: true,
      template: {
        id: paintTemplate.id,
        name: paintTemplate.name,
        description: paintTemplate.description,
        width: paintTemplate.width,
        height: paintTemplate.height,
        regions: JSON.parse(paintTemplate.regions),
        thumbnailUrl: paintTemplate.thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error('Upload error:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(400)
        .json({ error: 'File too large. Maximum size is 10MB.' });
    }

    res.status(500).json({
      error: 'Failed to generate paint template',
      message: error.message,
    });
  }
}
