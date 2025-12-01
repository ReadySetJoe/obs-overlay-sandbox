import { useEffect, useRef, useState, useCallback } from 'react';
import {
  WheelConfig,
  WheelSpinEvent,
  ColorScheme,
  CustomColors,
} from '@/types/overlay';
import { useThemeColors } from '@/hooks/useThemeColors';

interface WheelProps {
  config: WheelConfig | null;
  spinEvent: WheelSpinEvent | null;
  colorScheme: ColorScheme;
  customColors?: CustomColors | null;
}

export default function Wheel({
  config,
  spinEvent,
  colorScheme,
  customColors,
}: WheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerLabel, setWinnerLabel] = useState('');

  // Use refs for animation values to avoid re-renders during animation
  const currentRotationRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastProcessedTimestampRef = useRef<number | null>(null);

  const theme = useThemeColors(colorScheme, customColors || null);

  // Draw the wheel - using ref for rotation to avoid dependency issues
  const drawWheel = useCallback(
    (rotation: number = currentRotationRef.current) => {
      const canvas = canvasRef.current;
      if (!canvas || !config) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 20;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const segments = config.segments;
      const totalWeight = segments.reduce(
        (sum, seg) => sum + (seg.weight || 1),
        0
      );
      let currentAngle = rotation;

      // Draw segments
      segments.forEach(segment => {
        const weight = segment.weight || 1;
        const segmentAngle = (weight / totalWeight) * Math.PI * 2;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(
          centerX,
          centerY,
          radius,
          currentAngle,
          currentAngle + segmentAngle
        );
        ctx.closePath();
        ctx.fillStyle = segment.color;
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle + segmentAngle / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Inter';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(segment.label, radius * 0.7, 0);
        ctx.restore();

        currentAngle += segmentAngle;
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fillStyle = theme.primary;
      ctx.fill();
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Draw pointer at top
      ctx.beginPath();
      ctx.moveTo(centerX, 20);
      ctx.lineTo(centerX - 20, 50);
      ctx.lineTo(centerX + 20, 50);
      ctx.closePath();
      ctx.fillStyle = theme.accent;
      ctx.fill();
      ctx.strokeStyle = theme.accentLight;
      ctx.lineWidth = 3;
      ctx.stroke();
    },
    [config, theme]
  );

  // Spin animation effect - only depends on spinEvent and config
  useEffect(() => {
    if (!spinEvent || !config) {
      console.log('[Wheel Component] Missing spinEvent or config');
      return;
    }

    if (spinEvent.wheelId !== config.id) {
      console.log('[Wheel Component] Wheel ID mismatch');
      return;
    }

    // Check if we've already processed this spin event
    if (lastProcessedTimestampRef.current === spinEvent.timestamp) {
      console.log('[Wheel Component] Already processed this spin event');
      return;
    }

    // Check if already spinning
    if (isSpinningRef.current) {
      console.log('[Wheel Component] Already spinning, ignoring new spin event');
      return;
    }

    console.log('[Wheel Component] Starting new spin animation');

    // Mark this event as processed
    lastProcessedTimestampRef.current = spinEvent.timestamp;
    isSpinningRef.current = true;
    setShowWinner(false);

    const startTime = Date.now();
    const duration = config.spinDuration * 1000;
    const startRotation = currentRotationRef.current;

    // Calculate target rotation
    const segments = config.segments;
    const totalWeight = segments.reduce(
      (sum, seg) => sum + (seg.weight || 1),
      0
    );

    // Calculate the center angle of the winning segment
    let centerAngleOfWinner = 0;
    for (let i = 0; i < spinEvent.winningIndex; i++) {
      const weight = segments[i].weight || 1;
      centerAngleOfWinner += (weight / totalWeight) * Math.PI * 2;
    }
    // Add half of winning segment to get to its center
    const winningWeight = segments[spinEvent.winningIndex].weight || 1;
    centerAngleOfWinner += (winningWeight / 2 / totalWeight) * Math.PI * 2;

    // The pointer is at the top
    const extraSpins = 5; // Number of full rotations
    const pointerAngle = -Math.PI / 2; // Top of circle (12 o'clock)

    // Calculate rotation needed
    let rotationNeeded = pointerAngle - startRotation - centerAngleOfWinner;

    // Normalize to positive rotation
    while (rotationNeeded < 0) {
      rotationNeeded += Math.PI * 2;
    }

    // Add extra spins for effect
    const totalRotation =
      startRotation + extraSpins * Math.PI * 2 + rotationNeeded;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const newRotation =
        startRotation + (totalRotation - startRotation) * easeOut;

      // Update ref and draw (no state update to avoid re-renders)
      currentRotationRef.current = newRotation;
      drawWheel(newRotation);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        console.log('[Wheel Component] Spin animation complete');
        isSpinningRef.current = false;
        setWinnerLabel(spinEvent.winningLabel);
        setShowWinner(true);

        // Play sound if enabled
        if (config.soundEnabled) {
          const audio = new Audio('/sounds/wheel-winner.mp3');
          audio.volume = config.soundVolume;
          audio.play().catch(() => {
            // Ignore audio errors
          });
        }

        // Hide winner after 5 seconds
        setTimeout(() => {
          setShowWinner(false);
        }, 5000);
      }
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [spinEvent, config, drawWheel]); // Only depend on spinEvent and config

  // Initial draw and redraw when config/theme changes
  useEffect(() => {
    if (!isSpinningRef.current) {
      drawWheel(currentRotationRef.current);
    }
  }, [config, colorScheme, customColors, drawWheel]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!isSpinningRef.current) {
        drawWheel(currentRotationRef.current);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  if (!config || !config.isActive) {
    return null;
  }

  const getPositionStyles = () => {
    const baseStyles = {
      position: 'fixed' as const,
      transform: `scale(${config.scale})`,
      transformOrigin: 'center center',
      zIndex: 100,
    };

    switch (config.position) {
      case 'center':
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${config.scale})`,
        };
      case 'top-center':
        return {
          ...baseStyles,
          top: '10%',
          left: '50%',
          transform: `translate(-50%, 0) scale(${config.scale})`,
        };
      case 'bottom-center':
        return {
          ...baseStyles,
          bottom: '10%',
          left: '50%',
          transform: `translate(-50%, 0) scale(${config.scale})`,
        };
      default:
        return {
          ...baseStyles,
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) scale(${config.scale})`,
        };
    }
  };

  return (
    <div style={getPositionStyles()}>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        style={{
          filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))',
        }}
      />

      {/* Winner announcement */}
      {showWinner && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            border: `4px solid ${theme.accent}`,
            borderRadius: '20px',
            padding: '40px 60px',
            textAlign: 'center',
            animation: 'winner-appear 0.5s ease-out',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: theme.accentText,
              marginBottom: '10px',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}
          >
            Winner!
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#ffffff',
              textShadow: '0 4px 8px rgba(0, 0, 0, 0.5)',
            }}
          >
            {winnerLabel}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes winner-appear {
          0% {
            transform: translate(-50%, -50%) scale(0.5);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
