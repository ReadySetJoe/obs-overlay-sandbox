// pages/api/spotify/refresh.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { spotifyApi } from '@/lib/spotify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { refresh_token } = req.query;

  if (!refresh_token || typeof refresh_token !== 'string') {
    return res.status(400).json({ error: 'No refresh token provided' });
  }

  try {
    // Set the refresh token
    spotifyApi.setRefreshToken(refresh_token);

    // Request a refreshed access token
    const data = await spotifyApi.refreshAccessToken();
    const { access_token, expires_in } = data.body;

    res.json({
      access_token,
      expires_in,
      refresh_token, // Send back the same refresh token
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
}
