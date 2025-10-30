// pages/api/spotify/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getAuthUrl } from '@/lib/spotify';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authUrl = getAuthUrl();
  res.redirect(authUrl);
}
