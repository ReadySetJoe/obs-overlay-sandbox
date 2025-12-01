// hooks/useWheels.ts
import { useState, useEffect, useCallback } from 'react';
import { WheelConfig, ComponentLayouts } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import { useSocketEmit } from './useSocketEmit';

interface UseWheelsProps {
  sessionId: string | undefined;
  socket: Socket | null;
  componentLayouts: ComponentLayouts;
  setComponentLayouts: (layouts: ComponentLayouts) => void;
}

export function useWheels({
  sessionId,
  socket,
  componentLayouts,
  setComponentLayouts,
}: UseWheelsProps) {
  const [wheels, setWheels] = useState<WheelConfig[]>([]);
  const emitWheelListUpdate = useSocketEmit(socket, 'wheel-list-update');
  const emitWheelConfigUpdate = useSocketEmit(socket, 'wheel-config-update');

  // Load wheels
  useEffect(() => {
    if (!sessionId) return;

    const loadWheels = async () => {
      try {
        const response = await fetch(`/api/wheels/list?sessionId=${sessionId}`);
        if (response.ok) {
          const { wheels: loadedWheels } = await response.json();
          setWheels(loadedWheels);
        }
      } catch (error) {
        console.error('Error loading wheels:', error);
      }
    };

    loadWheels();
  }, [sessionId]);

  const handleCreateWheel = useCallback(
    async (wheel: Omit<WheelConfig, 'id' | 'layoutId'>) => {
      try {
        const response = await fetch('/api/wheels/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, ...wheel }),
        });

        if (response.ok) {
          const { wheel: newWheel } = await response.json();
          const updatedWheels = [...wheels, newWheel];
          setWheels(updatedWheels);

          // Broadcast update to overlay
          emitWheelListUpdate({ wheels: updatedWheels });
        }
      } catch (error) {
        console.error('Error creating wheel:', error);
      }
    },
    [sessionId, wheels, emitWheelListUpdate]
  );

  const handleUpdateWheel = useCallback(
    async (wheelId: string, updates: Partial<WheelConfig>) => {
      try {
        const response = await fetch(`/api/wheels/${wheelId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const { wheel: updatedWheel } = await response.json();

          // If activating a wheel, reload all wheels to get the updated states
          // (other wheels will have been deactivated in the database)
          if (updates.isActive === true) {
            const refreshResponse = await fetch(
              `/api/wheels/list?sessionId=${sessionId}`
            );
            if (refreshResponse.ok) {
              const { wheels: refreshedWheels } = await refreshResponse.json();
              setWheels(refreshedWheels);

              // Broadcast full list update to overlay
              emitWheelListUpdate({ wheels: refreshedWheels });
              return;
            }
          }

          // For deactivation or other updates, just update the single wheel
          const newWheels = wheels.map(w =>
            w.id === wheelId ? updatedWheel : w
          );
          setWheels(newWheels);

          // Broadcast update to overlay
          emitWheelConfigUpdate({ wheel: updatedWheel });
          emitWheelListUpdate({ wheels: newWheels });
        }
      } catch (error) {
        console.error('Error updating wheel:', error);
      }
    },
    [sessionId, wheels, emitWheelListUpdate, emitWheelConfigUpdate]
  );

  const handleDeleteWheel = useCallback(
    async (wheelId: string) => {
      try {
        const response = await fetch(`/api/wheels/${wheelId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const newWheels = wheels.filter(w => w.id !== wheelId);
          setWheels(newWheels);

          // Broadcast update to overlay
          emitWheelListUpdate({ wheels: newWheels });
        }
      } catch (error) {
        console.error('Error deleting wheel:', error);
      }
    },
    [wheels, emitWheelListUpdate]
  );

  const handleSpinWheel = useCallback(
    async (wheelId: string) => {
      try {
        const response = await fetch('/api/wheels/spin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wheelId, sessionId }),
        });

        if (response.ok) {
          const { winningLabel } = await response.json();
          console.log('Wheel spin result:', winningLabel);
          // The spin event is broadcasted via Socket.io from the API
        }
      } catch (error) {
        console.error('Error spinning wheel:', error);
      }
    },
    [sessionId]
  );

  const handleWheelPositionChange = useCallback(
    (position: 'center' | 'top-center' | 'bottom-center') => {
      setComponentLayouts({
        ...componentLayouts,
        wheel: {
          ...componentLayouts.wheel!,
          position,
        },
      });

      // Update active wheel's position
      const activeWheel = wheels.find(w => w.isActive);
      if (activeWheel) {
        handleUpdateWheel(activeWheel.id, { position });
      }
    },
    [componentLayouts, setComponentLayouts, wheels, handleUpdateWheel]
  );

  const handleWheelScaleChange = useCallback(
    (scale: number) => {
      setComponentLayouts({
        ...componentLayouts,
        wheel: {
          ...componentLayouts.wheel!,
          scale,
        },
      });

      // Update active wheel's scale
      const activeWheel = wheels.find(w => w.isActive);
      if (activeWheel) {
        handleUpdateWheel(activeWheel.id, { scale });
      }
    },
    [componentLayouts, setComponentLayouts, wheels, handleUpdateWheel]
  );

  return {
    wheels,
    handleCreateWheel,
    handleUpdateWheel,
    handleDeleteWheel,
    handleSpinWheel,
    handleWheelPositionChange,
    handleWheelScaleChange,
  };
}
