// lib/apiAuth.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { prisma } from '@/lib/prisma';

export interface LayoutOwner {
  /** Authenticated user's id. */
  userId: string;
  /** Id of the owned layout, or null when allowMissing let a new one through. */
  layoutId: string | null;
}

/**
 * Require that the caller is signed in AND owns the layout named by sessionId.
 *
 * Read endpoints that serve OBS browser sources are deliberately public: a
 * browser source cannot authenticate, so there a sessionId is treated as an
 * unguessable capability. Write endpoints must NOT use that model. A sessionId
 * appears in every OBS URL, is visible in any screenshot or stream of the OBS
 * window, and gets shared with moderators - so treating it as a password lets
 * anyone who has ever seen one rewrite the streamer's configuration.
 *
 * Checking the session alone is not enough either: sessionId arrives in the
 * request body, so without the ownership comparison any signed-in user could
 * modify another user's layout.
 *
 * On failure this writes the response and returns null; callers must return
 * immediately. On success it returns the owner info.
 */
export async function requireLayoutOwner(
  req: NextApiRequest,
  res: NextApiResponse,
  sessionId: string,
  opts: { allowMissing?: boolean } = {}
): Promise<LayoutOwner | null> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const layout = await prisma.layout.findUnique({
    where: { sessionId },
    select: { id: true, userId: true },
  });

  if (!layout) {
    // Used by layouts/save, which upserts: creating a layout you do not have
    // yet is legitimate, and it will be created with your own userId.
    if (opts.allowMissing) {
      return { userId: session.user.id, layoutId: null };
    }
    res.status(404).json({ error: 'Layout not found' });
    return null;
  }

  if (layout.userId !== session.user.id) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return { userId: session.user.id, layoutId: layout.id };
}

/**
 * Require that the caller is signed in AND owns the wheel named by wheelId.
 *
 * pages/api/wheels/[wheelId] takes the id from the query string and no
 * sessionId, so ownership has to resolve through the wheel's layout.
 */
export async function requireWheelOwner(
  req: NextApiRequest,
  res: NextApiResponse,
  wheelId: string
): Promise<LayoutOwner | null> {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  const wheel = await prisma.wheelConfig.findUnique({
    where: { id: wheelId },
    select: { layout: { select: { id: true, userId: true } } },
  });

  if (!wheel) {
    res.status(404).json({ error: 'Wheel not found' });
    return null;
  }

  if (wheel.layout.userId !== session.user.id) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return { userId: session.user.id, layoutId: wheel.layout.id };
}
