// lib/spotify.ts
import SpotifyWebApi from 'spotify-web-api-node';

const scopes = ['user-read-playback-state', 'user-read-currently-playing'];

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID || '',
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
  redirectUri: process.env.SPOTIFY_REDIRECT_URI || '',
});

export function getAuthUrl(sessionId?: string) {
  // Use sessionId as state to preserve it through OAuth flow
  const state = sessionId || 'no-session';
  return spotifyApi.createAuthorizeURL(scopes, state);
}
