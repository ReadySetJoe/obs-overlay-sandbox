// pages/api/spotify/callback.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { spotifyApi } from '@/lib/spotify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { code, state } = req.query;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'No code provided' });
  }

  try {
    const data = await spotifyApi.authorizationCodeGrant(code);
    const { access_token, refresh_token, expires_in } = data.body;

    // Extract sessionId from state parameter
    const sessionId = state && state !== 'no-session' ? state : '';

    // Redirect back to dashboard with sessionId and tokens
    const redirectPath = sessionId
      ? `/dashboard/${sessionId}`
      : '/dashboard';

    res.redirect(
      `${redirectPath}?access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`,
    );
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
}
