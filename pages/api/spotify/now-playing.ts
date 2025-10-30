// pages/api/spotify/now-playing.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { spotifyApi } from '@/lib/spotify';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { access_token } = req.query;

  if (!access_token || typeof access_token !== 'string') {
    return res.status(401).json({ error: 'No access token provided' });
  }

  spotifyApi.setAccessToken(access_token);

  try {
    const response = await spotifyApi.getMyCurrentPlayingTrack();

    if (!response.body || !response.body.item) {
      return res.json({ isPlaying: false });
    }

    const track = response.body.item;

    if (track.type !== 'track') {
      return res.json({ isPlaying: false });
    }

    res.json({
      isPlaying: response.body.is_playing,
      title: track.name,
      artist: track.artists.map((artist) => artist.name).join(', '),
      albumArt: track.album.images[0]?.url,
      progress: response.body.progress_ms,
      duration: track.duration_ms,
    });
  } catch (error) {
    console.error('Error fetching now playing:', error);
    res.status(500).json({ error: 'Failed to fetch now playing' });
  }
}
