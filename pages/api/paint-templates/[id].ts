// pages/api/paint-templates/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';
import { deleteFromCloudinary } from '@/lib/cloudinary';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    // Find template and verify ownership
    const template = await prisma.paintTemplateCustom.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (template.userId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Delete images from Cloudinary
    try {
      await deleteFromCloudinary(template.imagePublicId);
      console.log(`Deleted original image: ${template.imagePublicId}`);
    } catch (error) {
      console.error('Failed to delete original image from Cloudinary:', error);
      // Continue anyway
    }

    // Delete from database
    await prisma.paintTemplateCustom.delete({
      where: { id },
    });

    console.log(`Deleted template: ${id}`);

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete template error:', error);
    res.status(500).json({
      error: 'Failed to delete template',
      message: error.message,
    });
  }
}
