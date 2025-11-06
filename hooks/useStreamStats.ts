// hooks/useStreamStats.ts
import { useState, useCallback } from 'react';
import { StreamStatsConfig, StreamStatsData } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketState } from './useSocketState';

interface UseStreamStatsProps {
  sessionId: string | undefined;
  socket: Socket | null;
}

const DEFAULT_STREAM_STATS_CONFIG: StreamStatsConfig = {
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
};

const DEFAULT_STREAM_STATS_DATA: StreamStatsData = {
  currentFollowers: 0,
  currentSubs: 0,
  currentBits: 0,
  totalMessages: 0,
  uniqueChatters: 0,
  messagesPerMinute: 0,
  mostActiveChatterCount: 0,
  overallPositivityScore: 0,
  nicestChatterScore: 0,
};

export function useStreamStats({ sessionId, socket }: UseStreamStatsProps) {
  const [streamStatsData, setStreamStatsData] = useState<StreamStatsData>(
    DEFAULT_STREAM_STATS_DATA
  );

  const saveConfigToDatabase = useCallback(
    async (config: StreamStatsConfig) => {
      if (!sessionId) return;

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
    [sessionId]
  );

  const {
    value: streamStatsConfig,
    setValue: setStreamStatsConfig,
    emitValue: handleStreamStatsConfigChange,
  } = useSocketState<StreamStatsConfig>(
    socket,
    'stream-stats-config',
    DEFAULT_STREAM_STATS_CONFIG,
    { onEmit: saveConfigToDatabase }
  );

  return {
    streamStatsConfig,
    streamStatsData,
    setStreamStatsConfig,
    setStreamStatsData,
    handleStreamStatsConfigChange,
  };
}
