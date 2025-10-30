// pages/api/spotify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { spotifyApi } from '@/lib/spotify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { code } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    // Store tokens (you'll want to use a proper session/database in production)
    // For now, we'll redirect back to dashboard with tokens in query params
    res.redirect(
      `/dashboard?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`,
    );
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
}
