// hooks/useEventLabels.ts
import { EventLabelsConfig } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketState } from './useSocketState';

interface UseEventLabelsProps {
  socket: Socket | null;
}

const DEFAULT_EVENT_LABELS_CONFIG: EventLabelsConfig = {
  showFollower: false,
  showSub: false,
  showBits: false,
  showRaid: false,
  showGiftSub: false,
  followerLabel: 'Latest Follower',
  subLabel: 'Latest Subscriber',
  bitsLabel: 'Latest Bits',
  raidLabel: 'Latest Raid',
  giftSubLabel: 'Latest Gift Sub',
};

export function useEventLabels({ socket }: UseEventLabelsProps) {
  const {
    value: eventLabelsConfig,
    setValue: setEventLabelsConfig,
    emitValue: handleEventLabelsConfigChange,
  } = useSocketState<EventLabelsConfig>(
    socket,
    'event-labels-config',
    DEFAULT_EVENT_LABELS_CONFIG
  );

  return {
    eventLabelsConfig,
    setEventLabelsConfig,
    handleEventLabelsConfigChange,
  };
}
