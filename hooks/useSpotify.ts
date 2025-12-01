// hooks/useSpotify.ts
import { useState, useEffect } from 'react';
import { NowPlaying } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketEmit } from './useSocketEmit';

interface UseSpotifyProps {
  socket: Socket | null;
  isConnected: boolean;
  nowPlayingVisible: boolean;
}

export function useSpotify({
  socket,
  isConnected,
  nowPlayingVisible,
}: UseSpotifyProps) {
  // Initialize tokens from URL params or localStorage
  const getInitialTokens = () => {
    // Return null tokens during SSR (window is not defined on server)
    if (typeof window === 'undefined') {
      return { accessToken: null, refreshToken: null };
    }

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      localStorage.setItem('spotify_refresh_token', refreshToken);

      // Clean URL
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);

      return { accessToken, refreshToken };
    } else {
      const storedToken = localStorage.getItem('spotify_access_token');
      const storedRefresh = localStorage.getItem('spotify_refresh_token');
      return {
        accessToken: storedToken,
        refreshToken: storedRefresh,
      };
    }
  };

  const [spotifyToken, setSpotifyToken] = useState<string | null>(
    () => getInitialTokens().accessToken
  );
  const [spotifyRefreshToken, setSpotifyRefreshToken] = useState<string | null>(
    () => getInitialTokens().refreshToken
  );
  const [trackTitle, setTrackTitle] = useState('');
  const [trackArtist, setTrackArtist] = useState('');
  const [trackAlbumArt, setTrackAlbumArt] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  const emitNowPlaying = useSocketEmit(socket, 'now-playing');

  // Poll Spotify API for now playing
  useEffect(() => {
    if (!spotifyToken || !socket || !isConnected || !nowPlayingVisible) return;

    const pollSpotify = async () => {
      try {
        const response = await fetch(
          `/api/spotify/now-playing?access_token=${spotifyToken}`
        );

        if (response.status === 401 && spotifyRefreshToken) {
          const refreshResponse = await fetch(
            `/api/spotify/refresh?refresh_token=${spotifyRefreshToken}`
          );
          const refreshData = await refreshResponse.json();

          if (refreshResponse.ok) {
            setSpotifyToken(refreshData.access_token);
            localStorage.setItem(
              'spotify_access_token',
              refreshData.access_token
            );
            return;
          }
        }

        const data = await response.json();

        if (data.isPlaying) {
          const track: NowPlaying = {
            title: data.title,
            artist: data.artist,
            albumArt: data.albumArt,
            isPlaying: data.isPlaying,
            progress: data.progress,
            duration: data.duration,
            timestamp: Date.now(),
          };
          emitNowPlaying(track);
          setTrackTitle(data.title);
          setTrackArtist(data.artist);
          setTrackAlbumArt(data.albumArt);
          setIsPlaying(data.isPlaying);
        } else {
          emitNowPlaying({
            title: trackTitle,
            artist: trackArtist,
            albumArt: trackAlbumArt,
            isPlaying: false,
          });
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
      }
    };

    pollSpotify();
    const interval = setInterval(pollSpotify, 5000);
    return () => clearInterval(interval);
  }, [
    spotifyToken,
    socket,
    isConnected,
    nowPlayingVisible,
    spotifyRefreshToken,
    trackTitle,
    trackArtist,
    trackAlbumArt,
    emitNowPlaying,
  ]);

  const updateNowPlaying = () => {
    const track: NowPlaying = {
      title: trackTitle,
      artist: trackArtist,
      albumArt: trackAlbumArt,
      isPlaying,
    };

    emitNowPlaying(track);
  };

  const disconnect = () => {
    setSpotifyToken(null);
    setSpotifyRefreshToken(null);
    localStorage.removeItem('spotify_access_token');
    localStorage.removeItem('spotify_refresh_token');
  };

  return {
    spotifyToken,
    trackTitle,
    trackArtist,
    trackAlbumArt,
    isPlaying,
    setTrackTitle,
    setTrackArtist,
    setTrackAlbumArt,
    setIsPlaying,
    updateNowPlaying,
    disconnect,
  };
}
