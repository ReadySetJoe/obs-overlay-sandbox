// hooks/useOriginUrl.ts
import { useState, useEffect } from 'react';

export function useOriginUrl(): string {
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    // Only access window on client side
    if (typeof window !== 'undefined') {
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
