// pages/api/paint-templates/list.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user's custom templates
    const templates = await prisma.paintTemplateCustom.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
        width: true,
        height: true,
        regions: true,
        imageUrl: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    });

    // Parse regions JSON for each template
    const parsedTemplates = templates.map(template => ({
      ...template,
      regions: JSON.parse(template.regions),
    }));

    res.status(200).json({
      success: true,
      templates: parsedTemplates,
    });
  } catch (error: any) {
    console.error('List templates error:', error);
    res.status(500).json({
      error: 'Failed to list templates',
      message: error.message,
    });
  }
}
