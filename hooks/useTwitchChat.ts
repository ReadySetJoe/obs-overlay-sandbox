// hooks/useTwitchChat.ts
import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, ChatHighlight, ComponentLayouts } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { Session } from 'next-auth';

interface UseTwitchChatProps {
  sessionId: string | undefined;
  session: Session | null;
  socket: Socket | null;
}

export function useTwitchChat({
  sessionId,
  session,
  socket,
}: UseTwitchChatProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatHighlight, setChatHighlight] = useState<ChatHighlight | null>(
    null
  );

  // Auto-connect to Twitch chat when authenticated
  useEffect(() => {
    if (!session || !sessionId) return;

    let isActive = true; // Track if this effect is still active

    const connectTwitchChat = async () => {
      try {
        const response = await fetch('/api/twitch/connect-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });

        if (!response.ok && isActive) {
          console.error('Failed to connect to Twitch chat');
        }
      } catch (error) {
        if (isActive) {
          console.error('Error connecting to Twitch chat:', error);
        }
      }
    };

    connectTwitchChat();

    // Cleanup: disconnect when component unmounts
    return () => {
      isActive = false;
      fetch('/api/twitch/disconnect-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      }).catch(console.error);
    };
  }, [session, sessionId]);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (message: ChatMessage) => {
      setChatMessages(prev => {
        // Check if message already exists (deduplicate)
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          return prev;
        }
        // Add new message and keep only the last 100 messages
        const updated = [...prev, message];
        return updated.slice(-100);
      });
    };

    socket.on('chat-message', handleChatMessage);

    return () => {
      socket.off('chat-message', handleChatMessage);
    };
  }, [socket]);

  // Highlight a chat message
  const highlightChatMessage = useCallback(
    (message: ChatMessage, componentLayouts: ComponentLayouts) => {
      if (!socket) return;

      const highlight: ChatHighlight = {
        message,
        timestamp: Date.now(),
      };

      setChatHighlight(highlight);

      // Ensure layouts are synced BEFORE sending the highlight
      socket.emit('component-layouts', componentLayouts);

      // Small delay to ensure layout is received first
      setTimeout(() => {
        socket.emit('chat-highlight', highlight);
      }, 50);
    },
    [socket]
  );

  // Clear chat highlight
  const clearChatHighlight = useCallback(
    (componentLayouts: ComponentLayouts) => {
      if (!socket) return;

      setChatHighlight(null);

      // Ensure layouts are synced before clearing
      socket.emit('component-layouts', componentLayouts);

      setTimeout(() => {
        socket.emit('chat-highlight', null);
      }, 50);
    },
    [socket]
  );

  return {
    chatMessages,
    chatHighlight,
    highlightChatMessage,
    clearChatHighlight,
  };
}
