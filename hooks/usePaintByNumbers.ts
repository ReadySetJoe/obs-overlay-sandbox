// hooks/usePaintByNumbers.ts
import { useState, useEffect, useCallback } from 'react';
import { PaintByNumbersState, ComponentLayouts } from '@/types/overlay';
import { Socket } from 'socket.io-client';
import {
  loadMostRecentTemplate,
  loadTemplateState,
  createFreshTemplate,
  resetTemplate,
  handlePaintCommand as processPaintCommand,
  handlePaintAllCommand as processPaintAllCommand,
  handlePaintRandomCommand as processPaintRandomCommand,
} from '@/lib/paintStateManager';

interface UsePaintByNumbersProps {
  sessionId: string | undefined;
  session: { user?: { id?: string } } | null;
  socket: Socket | null;
  isConnected: boolean;
}

export function usePaintByNumbers({
  sessionId,
  session,
  socket,
  isConnected,
}: UsePaintByNumbersProps) {
  const [paintByNumbersState, setPaintByNumbersState] =
    useState<PaintByNumbersState | null>(null);

  // Initialize paint-by-numbers (load last template or default to heart)
  useEffect(() => {
    if (!paintByNumbersState && socket && isConnected && session && sessionId) {
      const initializeTemplate = async () => {
        try {
          // Try to load most recent template
          const loadedState = await loadMostRecentTemplate(sessionId);

          if (loadedState) {
            setPaintByNumbersState(loadedState);
            socket.emit('paint-state', loadedState);
          } else {
            // No saved state found, initialize with heart template
            const heartState = await createFreshTemplate('heart');
            if (heartState) {
              setPaintByNumbersState(heartState);
              socket.emit('paint-state', heartState);
            }
          }
        } catch (error) {
          console.error('Error initializing paint state:', error);
        }
      };

      initializeTemplate();
    }
  }, [socket, isConnected, paintByNumbersState, session, sessionId]);

  // Handle template selection
  const handleTemplateSelect = useCallback(
    async (templateId: string) => {
      if (!sessionId || !socket) return;

      const state = await loadTemplateState(templateId, sessionId);
      if (state) {
        setPaintByNumbersState(state);
        socket.emit('paint-state', state);
      }
    },
    [sessionId, socket]
  );

  // Handle template reset
  const handleReset = useCallback(async () => {
    if (!paintByNumbersState || !socket) return;

    const resetState = await resetTemplate(paintByNumbersState);
    if (resetState) {
      setPaintByNumbersState(resetState);
      socket.emit('paint-state', resetState);
    }
  }, [paintByNumbersState, socket]);

  // Handle paint commands from chat
  useEffect(() => {
    if (!socket) return;

    const handlePaintCommandEvent = (data: {
      regionId: number;
      username: string;
      timestamp: number;
      customColor?: string;
    }) => {
      if (!paintByNumbersState) return;

      const updatedState = processPaintCommand(
        paintByNumbersState,
        data.regionId,
        data.username,
        data.timestamp,
        data.customColor
      );

      if (updatedState) {
        setPaintByNumbersState(updatedState);
        socket.emit('paint-state', updatedState);
      }
    };

    const handlePaintAllCommandEvent = (data: {
      username: string;
      timestamp: number;
    }) => {
      if (!paintByNumbersState) return;

      const updatedState = processPaintAllCommand(
        paintByNumbersState,
        data.username,
        data.timestamp
      );
      setPaintByNumbersState(updatedState);
      socket.emit('paint-state', updatedState);
    };

    const handlePaintRandomCommandEvent = (data: {
      username: string;
      timestamp: number;
    }) => {
      if (!paintByNumbersState) return;

      const updatedState = processPaintRandomCommand(
        paintByNumbersState,
        data.username,
        data.timestamp
      );
      setPaintByNumbersState(updatedState);
      socket.emit('paint-state', updatedState);
    };

    socket.on('paint-command', handlePaintCommandEvent);
    socket.on('paint-all-command', handlePaintAllCommandEvent);
    socket.on('paint-random-command', handlePaintRandomCommandEvent);

    return () => {
      socket.off('paint-command', handlePaintCommandEvent);
      socket.off('paint-all-command', handlePaintAllCommandEvent);
      socket.off('paint-random-command', handlePaintRandomCommandEvent);
    };
  }, [socket, paintByNumbersState]);

  // Handle layout changes
  const handlePositionChange = useCallback(
    (
      x: number,
      y: number,
      componentLayouts: ComponentLayouts,
      setComponentLayouts: (layouts: ComponentLayouts) => void
    ) => {
      setComponentLayouts({
        ...componentLayouts,
        paintByNumbers: {
          ...(componentLayouts.paintByNumbers || {
            position: 'top-left',
            scale: 1,
            gridSize: 20,
          }),
          x,
          y,
        },
      });
    },
    []
  );

  const handleScaleChange = useCallback(
    (
      scale: number,
      componentLayouts: ComponentLayouts,
      setComponentLayouts: (layouts: ComponentLayouts) => void
    ) => {
      setComponentLayouts({
        ...componentLayouts,
        paintByNumbers: {
          ...(componentLayouts.paintByNumbers || {
            position: 'top-left',
            x: 0,
            y: 0,
            gridSize: 20,
          }),
          scale,
        },
      });
    },
    []
  );

  const handleGridSizeChange = useCallback(
    (
      gridSize: number,
      componentLayouts: ComponentLayouts,
      setComponentLayouts: (layouts: ComponentLayouts) => void
    ) => {
      setComponentLayouts({
        ...componentLayouts,
        paintByNumbers: {
          ...(componentLayouts.paintByNumbers || {
            position: 'top-left',
            x: 0,
            y: 0,
            scale: 1,
          }),
          gridSize,
        },
      });
    },
    []
  );

  return {
    paintByNumbersState,
    handleTemplateSelect,
    handleReset,
    handlePositionChange,
    handleScaleChange,
    handleGridSizeChange,
  };
}
