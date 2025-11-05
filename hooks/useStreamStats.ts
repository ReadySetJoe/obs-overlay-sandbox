// hooks/useStreamStats.ts
import { useState, useCallback } from 'react';
import { StreamStatsConfig, StreamStatsData } from '@/types/overlay';
import { Socket } from 'socket.io-client';

interface UseStreamStatsProps {
  sessionId: string | undefined;
  socket: Socket | null;
}

export function useStreamStats({ sessionId, socket }: UseStreamStatsProps) {
  const [streamStatsConfig, setStreamStatsConfig] = useState<StreamStatsConfig>(
    {
      followerGoal: 100,
      subGoal: 50,
      bitsGoal: 1000,
      showFollowerGoal: false,
      showSubGoal: false,
      showBitsGoal: false,
      showTotalMessages: false,
      showUniqueChatters: false,
      showMessagesPerMinute: false,
      showMostActiveChatter: false,
      showPositivityScore: false,
      showNicestChatter: false,
      resetOnStream: false,
    }
  );

  const [streamStatsData, setStreamStatsData] = useState<StreamStatsData>({
    currentFollowers: 0,
    currentSubs: 0,
    currentBits: 0,
    totalMessages: 0,
    uniqueChatters: 0,
    messagesPerMinute: 0,
    mostActiveChatterCount: 0,
    overallPositivityScore: 0,
    nicestChatterScore: 0,
  });

  const handleStreamStatsConfigChange = useCallback(
    async (config: StreamStatsConfig) => {
      if (!socket || !sessionId) return;
      setStreamStatsConfig(config);
      socket.emit('stream-stats-config', config);

      // Save to database
      try {
        await fetch('/api/layouts/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            streamStatsConfig: JSON.stringify(config),
          }),
        });
      } catch (error) {
        console.error('Error saving stream stats config:', error);
      }
    },
    [sessionId, socket]
  );

  return {
    streamStatsConfig,
    streamStatsData,
    setStreamStatsConfig,
    setStreamStatsData,
    handleStreamStatsConfigChange,
  };
}
