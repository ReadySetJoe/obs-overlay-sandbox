import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Wheel from '@/components/overlay/Wheel';
import { useOverlaySocket } from '@/hooks/useOverlaySocket';
import {
  WheelConfig,
  WheelSpinEvent,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';

export default function WheelOverlay() {
  const router = useRouter();
  const { sessionId } = router.query;
  const overlayState = useOverlaySocket(sessionId as string);
  const socket = overlayState.socket;

  const [activeWheel, setActiveWheel] = useState<WheelConfig | null>(null);
  const [spinEvent, setSpinEvent] = useState<WheelSpinEvent | null>(null);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('default');
  const [customColors, setCustomColors] = useState<CustomColors | null>(null);

  // Load initial wheel data
  useEffect(() => {
    if (!sessionId) return;

    const loadData = async () => {
      try {
        // Load layout for color scheme
        const layoutRes = await fetch(
          `/api/layouts/load?sessionId=${sessionId}`
        );
        const layoutData = await layoutRes.json();

        if (layoutData.layout) {
          setColorScheme(layoutData.layout.colorScheme || 'default');
          if (layoutData.layout.customColors) {
            setCustomColors(JSON.parse(layoutData.layout.customColors));
          }
        }

        // Load wheels
        const wheelsRes = await fetch(
          `/api/wheels/list?sessionId=${sessionId}`
        );
        const wheelsData = await wheelsRes.json();

        if (wheelsData.wheels) {
          const active = wheelsData.wheels.find((w: WheelConfig) => w.isActive);
          setActiveWheel(active || null);
        }
      } catch (error) {
        console.error('Error loading wheel data:', error);
      }
    };

    loadData();
  }, [sessionId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('[Wheel Overlay] Socket not available');
      return;
    }

    console.log('[Wheel Overlay] Setting up socket event listeners');

    // Listen for wheel updates
    const handleWheelConfigUpdate = (data: { wheel: WheelConfig }) => {
      console.log('[Wheel Overlay] Received wheel-config-update:', data);
      if (data.wheel.isActive) {
        setActiveWheel(data.wheel);
      } else if (activeWheel?.id === data.wheel.id) {
        setActiveWheel(null);
      }
    };

    // Listen for wheel list updates
    const handleWheelListUpdate = (data: { wheels: WheelConfig[] }) => {
      console.log('[Wheel Overlay] Received wheel-list-update:', data);
      const active = data.wheels.find(w => w.isActive);
      setActiveWheel(active || null);
    };

    // Listen for spin events
    const handleWheelSpin = (data: WheelSpinEvent) => {
      console.log('[Wheel Overlay] Received wheel-spin event:', data);
      console.log('[Wheel Overlay] Current activeWheel:', activeWheel);
      setSpinEvent(data);
    };

    // Listen for color scheme changes
    const handleColorSchemeChange = (data: { colorScheme: ColorScheme }) => {
      setColorScheme(data.colorScheme);
    };

    const handleCustomColorsChange = (data: { colors: CustomColors }) => {
      setCustomColors(data.colors);
    };

    socket.on('wheel-config-update', handleWheelConfigUpdate);
    socket.on('wheel-list-update', handleWheelListUpdate);
    socket.on('wheel-spin', handleWheelSpin);
    socket.on('color-scheme-change', handleColorSchemeChange);
    socket.on('custom-colors-change', handleCustomColorsChange);

    return () => {
      socket.off('wheel-config-update', handleWheelConfigUpdate);
      socket.off('wheel-list-update', handleWheelListUpdate);
      socket.off('wheel-spin', handleWheelSpin);
      socket.off('color-scheme-change', handleColorSchemeChange);
      socket.off('custom-colors-change', handleCustomColorsChange);
    };
  }, [socket, activeWheel]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <Wheel
        config={activeWheel}
        spinEvent={spinEvent}
        colorScheme={colorScheme}
        customColors={customColors}
      />
    </div>
  );
}
