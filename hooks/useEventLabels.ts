// hooks/useEventLabels.ts
import { useState, useCallback } from 'react';
import { EventLabelsConfig } from '@/types/overlay';
import { Socket } from 'socket.io-client';

interface UseEventLabelsProps {
  socket: Socket | null;
}

export function useEventLabels({ socket }: UseEventLabelsProps) {
  const [eventLabelsConfig, setEventLabelsConfig] = useState<EventLabelsConfig>(
    {
      showFollower: true,
      showSub: true,
      showBits: true,
      showRaid: true,
      showGiftSub: true,
      followerLabel: 'Latest Follower',
      subLabel: 'Latest Subscriber',
      bitsLabel: 'Latest Bits',
      raidLabel: 'Latest Raid',
      giftSubLabel: 'Latest Gift Sub',
    }
  );

  const handleEventLabelsConfigChange = useCallback(
    (config: EventLabelsConfig) => {
      if (!socket) return;
      setEventLabelsConfig(config);
      socket.emit('event-labels-config', config);
    },
    [socket]
  );

  return {
    eventLabelsConfig,
    setEventLabelsConfig,
    handleEventLabelsConfigChange,
  };
}
