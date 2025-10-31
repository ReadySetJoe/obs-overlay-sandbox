// pages/overlay/[sessionId]/chat-highlight.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import ChatHighlight from '@/components/overlay/ChatHighlight';

export default function ChatHighlightOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    chatHighlight,
    componentLayouts,
    getLayerVisible,
    colorScheme,
    colorSchemeStyles,
  } = useOverlaySocket(sessionId as string);

  return (
    <div
      className={`
        relative w-screen h-screen overflow-hidden
        bg-gradient-to-br ${colorSchemeStyles[colorScheme]}
        transition-all duration-1000
      `}
    >
      {/* Connection Status */}
      {!isConnected && (
        <div className='fixed top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'>
          Disconnected
        </div>
      )}

      {/* Chat Highlight */}
      {getLayerVisible('chathighlight') && (
        <ChatHighlight
          highlight={chatHighlight}
          layout={componentLayouts.chatHighlight}
        />
      )}
    </div>
  );
}
