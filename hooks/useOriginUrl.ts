// hooks/useOriginUrl.ts
import { useState, useEffect } from 'react';

export function useOriginUrl(): string {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // window.location has to be read after mount rather than in a useState
    // initializer: the server renders an empty string, and a lazy initializer
    // would return a different value on the client - a hydration mismatch.
    // One extra render on mount is the deliberate trade-off.
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrigin(window.location.origin);
    }
  }, []);

  return origin;
}

export function useOverlayUrl(sessionId: string, path?: string): string {
  const origin = useOriginUrl();

  if (!origin) return '';

  const basePath = `/overlay/${sessionId}`;
  return path ? `${origin}${basePath}/${path}` : `${origin}${basePath}`;
}
