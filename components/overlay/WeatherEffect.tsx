// components/overlay/WeatherEffect.tsx
'use client';

import { useEffect, useRef } from 'react';
import { WeatherEffect as WeatherEffectType } from '@/types/overlay';

interface WeatherEffectProps {
  effect: WeatherEffectType;
}

interface Drop {
  x: number;
  y: number;
  speed: number;
  size: number;
}

export default function WeatherEffect({ effect }: WeatherEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropsRef = useRef<Drop[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (effect === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const createDrop = (): Drop => {
      return {
        x: Math.random() * canvas.width,
        y: -10,
        speed:
          effect === 'snow' ? Math.random() * 1 + 0.5 : Math.random() * 5 + 5,
        size: effect === 'snow' ? Math.random() * 3 + 2 : Math.random() * 2 + 1,
      };
    };

    // Initialize drops
    const dropCount = effect === 'confetti' ? 100 : 150;
    for (let i = 0; i < dropCount; i++) {
      const drop = createDrop();
      drop.y = Math.random() * canvas.height;
      dropsRef.current.push(drop);
    }

    const drawRain = (drop: Drop) => {
      ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
      ctx.lineWidth = drop.size;
      ctx.beginPath();
      ctx.moveTo(drop.x, drop.y);
      ctx.lineTo(drop.x, drop.y + 10);
      ctx.stroke();
    };

    const drawSnow = (drop: Drop) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.size, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawConfetti = (drop: Drop) => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7'];
      ctx.fillStyle = colors[Math.floor(drop.x) % colors.length];
      ctx.fillRect(drop.x, drop.y, drop.size * 2, drop.size * 3);
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dropsRef.current.forEach(drop => {
        // Update position
        drop.y += drop.speed;

        if (effect === 'snow') {
          drop.x += Math.sin(drop.y / 30) * 0.5;
        }

        // Reset if off screen
        if (drop.y > canvas.height) {
          drop.y = -10;
          drop.x = Math.random() * canvas.width;
        }

        // Draw based on effect type
        switch (effect) {
          case 'rain':
            drawRain(drop);
            break;
          case 'snow':
            drawSnow(drop);
            break;
          case 'confetti':
            drawConfetti(drop);
            break;
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      dropsRef.current = [];
    };
  }, [effect]);

  if (effect === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className='fixed inset-0 pointer-events-none'
      style={{ zIndex: 2 }}
    />
  );
}
