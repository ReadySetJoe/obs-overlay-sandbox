// pages/overlay/[sessionId]/chat-highlight.tsx
'use client';

import { useRouter } from 'next/router';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import ChatHighlight from '@/components/overlay/ChatHighlight';
import ConnectionStatus from '@/components/overlay/ConnectionStatus';
import ResolutionWarning from '@/components/overlay/ResolutionWarning';

export default function ChatHighlightOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const {
    isConnected,
    chatHighlight,
    componentLayouts,
    getLayerVisible,
    colorScheme,
    customColors,
    colorSchemeStyles,
    customGradientCSS,
  } = useOverlaySocket(sessionId as string);

  return (
    <div
      className={`
        relative w-screen h-screen overflow-hidden
        ${customGradientCSS ? '' : `bg-linear-to-br ${colorSchemeStyles[colorScheme]}`}
        transition-all duration-1000
      `}
      style={customGradientCSS ? { background: customGradientCSS } : {}}
    >
      {/* Connection Status */}
      <ConnectionStatus isConnected={isConnected} />
      <ResolutionWarning />

      {/* Chat Highlight */}
      {getLayerVisible('chathighlight') && (
        <ChatHighlight
          highlight={chatHighlight}
          layout={componentLayouts.chatHighlight}
          colorScheme={colorScheme}
          customColors={customColors}
        />
      )}
    </div>
  );
}
