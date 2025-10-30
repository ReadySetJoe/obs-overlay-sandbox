// pages/api/spotify/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUrl } from '@/lib/spotify';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { sessionId } = req.query;
  const authUrl = getAuthUrl(sessionId as string);
  res.redirect(authUrl);
}
