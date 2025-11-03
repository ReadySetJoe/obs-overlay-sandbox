// pages/overlay/[sessionId]/background.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';

export default function BackgroundOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const { isConnected, backgroundImageUrl, backgroundOpacity, backgroundBlur } =
    useOverlaySocket(sessionId as string);

  return (
    <div className='relative w-screen h-screen overflow-hidden bg-black'>
      {/* Connection Status */}
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}

      {/* Custom Background */}
      {backgroundImageUrl ? (
        <div
          className='absolute inset-0'
          style={{
            backgroundImage: `url(${backgroundImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: backgroundOpacity || 1,
            filter: `blur(${backgroundBlur || 0}px)`,
          }}
        />
      ) : (
        /* Placeholder when no background is uploaded */
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center text-gray-500'>
            <div className='text-6xl mb-4'>🖼️</div>
            <div className='text-xl font-medium'>No background uploaded</div>
            <div className='text-sm mt-2'>
              Upload a custom background from the dashboard
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
